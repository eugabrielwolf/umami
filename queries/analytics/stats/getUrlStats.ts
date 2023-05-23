import prisma from 'lib/prisma';
import { runQuery, MONGODB } from 'lib/db';
import { EVENT_TYPE } from 'lib/constants';
import { loadWebsite } from 'lib/query';

export async function getUrlStats(
  ...args: [
    websiteId: string,
    data: { startDate: Date; endDate: Date; type?: string; filters: object },
  ]
) {
  return runQuery({
    [MONGODB]: () => mongodbQuery(...args),
  });
}

async function mongodbQuery(
  websiteId: string,
  criteria: { startDate: Date; endDate: Date; filters: object },
) {
  const { startDate, endDate } = criteria;
  const { client } = prisma;
  const website = await loadWebsite(websiteId);
  const resetDate = new Date(website?.resetAt || website?.createdAt);

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
                $lte: [
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
          session_id: 1,
          hour: {
            $toString: {
              $hour: "$created_at",
            },
          },
          url_path: 1,
          created_at: 1,
        },
      },
      {
        $group: {
          _id: {
            session_id: "$session_id",
            hour: "$hour",
            url_path: "$url_path",
          },
          count: {
            $sum: 1,
          },
          timeMax: {
            $max: "$created_at",
          },
          timeMin: {
            $min: "$created_at",
          },
        },
      },
      {
        $project: {
          _id : 0,
          session_id: "$_id.session_id",
          hour: "$_id.hour",
          url_path: "$_id.url_path",
          count: 1,
          time: {
            $dateDiff: {
              endDate: "$timeMax",
              startDate: "$timeMin",
              unit: "second",
            },
          },
          bounce: {
            $cond: {
              if: {
                $eq: ["$count", 1],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: {
            session_id: "$session_id",
            url_path: "$url_path",
          },
          pageviews: {
            $sum: "$count",
          },
          bounces: {
            $sum: "$bounce",
          },
          totaltime: {
            $sum: "$time",
          },
        },
      },
      {
        $group: {
          _id: "$_id.url_path",
          pageviews: {
            $sum: "$pageviews",
          },
          uniques: {
            $sum: 1,
          },
          bounces: {
            $sum: "$bounces",
          },
          totaltime: {
            $sum: "$totaltime",
          }
        }
      }
    ]
  });
}
