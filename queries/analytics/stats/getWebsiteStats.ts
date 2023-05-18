import prisma from 'lib/prisma';
import clickhouse from 'lib/clickhouse';
import { runQuery, CLICKHOUSE, PRISMA } from 'lib/db';
import { EVENT_TYPE } from 'lib/constants';
import { loadWebsite } from 'lib/query';

export async function getWebsiteStats(
  ...args: [
    websiteId: string,
    data: { startDate: Date; endDate: Date; type?: string; filters: object },
  ]
) {
  return runQuery({
    [PRISMA]: () => relationalQuery(...args),
    [CLICKHOUSE]: () => clickhouseQuery(...args),
  });
}

async function relationalQuery(
  websiteId: string,
  criteria: { startDate: Date; endDate: Date; filters: object },
) {
  const { startDate, endDate, filters = {} } = criteria;
  const {
    getDatabaseType,
    toUuid,
    getDateQuery,
    getTimestampInterval,
    parseFilters,
    rawQuery,
    client,
  } = prisma;
  const db = getDatabaseType();
  const website = await loadWebsite(websiteId);
  const resetDate = new Date(website?.resetAt || website?.createdAt);
  const params: any = [websiteId, resetDate, startDate, endDate];
  const { filterQuery, joinSession } = parseFilters(filters, params);

  if (db === 'mongodb') {
    return await client.websiteEvent.aggregateRaw({
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: ['$event_type', EVENT_TYPE.pageView],
                },
                {
                  $eq: ['$website_id', websiteId],
                },
                {
                  $gte: [
                    '$created_at',
                    {
                      $dateFromString: {
                        dateString: resetDate.toISOString(),
                      },
                    },
                  ],
                },
                {
                  $gte: [
                    '$created_at',
                    {
                      $dateFromString: {
                        dateString: startDate.toISOString(),
                      },
                    },
                  ],
                },
                {
                  lte: [
                    '$created_at',
                    {
                      $dateFromString: {
                        dateString: endDate.toISOString(),
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $project: {
            session_id: '$session_id',
            hour: {
              $toString: { $hour: '$created_at' },
            },
            created_at: '$created_at',
          },
        },
        {
          $group: {
            _id: {
              $concat: ['$session_id', ':', '$hour'],
            },
            session_id: { $first: '$session_id' },
            hour: { $first: '$hour' },
            count: { $sum: 1 },
            timeMax: { $max: '$created_at' },
            timeMin: { $min: '$created_at' },
          },
        },
        {
          $project: {
            _id: '$_id',
            session_id: '$session_id',
            hour: '$hour',
            count: '$count',
            time: {
              $dateDiff: {
                endDate: '$timeMax',
                startDate: '$timeMin',
                unit: 'second',
              },
            },
            bounce: {
              $cond: {
                if: { $eq: ['$count', 1] },
                then: 1,
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: '$session_id',
            pageviews: { $sum: '$count' },
            bounces: { $sum: '$bounce' },
            totaltime: { $sum: '$time' },
          },
        },
        {
          $group: {
            _id: '',
            pageviews: { $sum: '$pageviews' },
            uniques: { $sum: 1 },
            bounces: { $sum: '$bounces' },
            totaltime: { $sum: '$totaltime' },
          },
        },
      ],
    });
  } else {
    return rawQuery(
      `select sum(t.c) as "pageviews",
        count(distinct t.session_id) as "uniques",
        sum(case when t.c = 1 then 1 else 0 end) as "bounces",
        sum(t.time) as "totaltime"
      from (
        select website_event.session_id,
          ${getDateQuery('website_event.created_at', 'hour')},
          count(*) c,
          ${getTimestampInterval('website_event.created_at')} as "time"
        from website_event
          join website 
            on website_event.website_id = website.website_id
          ${joinSession}
        where event_type = ${EVENT_TYPE.pageView}
          and website.website_id = $1${toUuid()}
          and website_event.created_at >= $2
          and website_event.created_at between $3 and $4
          ${filterQuery}
        group by 1, 2
     ) t`,
      params,
    );
  }
}

async function clickhouseQuery(
  websiteId: string,
  criteria: { startDate: Date; endDate: Date; filters: object },
) {
  const { startDate, endDate, filters = {} } = criteria;
  const { rawQuery, getDateFormat, getDateQuery, getBetweenDates, parseFilters } = clickhouse;
  const website = await loadWebsite(websiteId);
  const resetDate = new Date(website?.resetAt || website?.createdAt);
  const params = { websiteId };
  const { filterQuery } = parseFilters(filters, params);

  return rawQuery(
    `select 
       sum(t.c) as "pageviews",
       count(distinct t.session_id) as "uniques",
       sum(if(t.c = 1, 1, 0)) as "bounces",
       sum(if(max_time < min_time + interval 1 hour, max_time-min_time, 0)) as "totaltime"
     from (
       select session_id,
         ${getDateQuery('created_at', 'day')} time_series,
         count(*) c,
         min(created_at) min_time,
         max(created_at) max_time
       from website_event
       where event_type = ${EVENT_TYPE.pageView}
        and website_id = {websiteId:UUID}
          and created_at >= ${getDateFormat(resetDate)}
          and ${getBetweenDates('created_at', startDate, endDate)}
         ${filterQuery}
       group by session_id, time_series
     ) t;`,
    params,
  );
}
