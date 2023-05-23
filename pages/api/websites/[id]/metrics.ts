import { NextApiResponse } from 'next';
import { methodNotAllowed, ok, unauthorized } from 'next-basics';
import { NextApiRequestQueryBody, WebsiteMetric } from 'lib/types';
import { canViewWebsite } from 'lib/auth';
import { useAuth, useCors } from 'lib/middleware';
import { EVENT_COLUMNS, FILTER_COLUMNS, SESSION_COLUMNS } from 'lib/constants';
import { getPageviewMetrics, getSessionMetrics, getUrlStats } from 'queries';

export interface WebsiteMetricsRequestQuery {
  id: string;
  type: string;
  startAt: number;
  endAt: number;
  url: string;
  referrer: string;
  title: string;
  query: string;
  event: string;
  os: string;
  browser: string;
  device: string;
  country: string;
  region: string;
  city: string;
}

export default async (
  req: NextApiRequestQueryBody<WebsiteMetricsRequestQuery>,
  res: NextApiResponse<WebsiteMetric[]>,
) => {
  await useCors(req, res);
  await useAuth(req, res);

  const {
    id: websiteId,
    type,
    startAt,
    endAt,
    url,
    referrer,
    title,
    query,
    event,
    os,
    browser,
    device,
    country,
    region,
    city,
  } = req.query;

  if (req.method === 'GET') {
    if (!(await canViewWebsite(req.auth, websiteId))) {
      return unauthorized(res);
    }

    const startDate = new Date(+startAt);
    const endDate = new Date(+endAt);

    if (SESSION_COLUMNS.includes(type)) {
      const column = FILTER_COLUMNS[type] || type;
      const filters = {
        os,
        browser,
        device,
        country,
        region,
        city,
      };

      filters[type] = undefined;

      let data = await getSessionMetrics(websiteId, {
        startDate,
        endDate,
        column,
        filters,
      });

      if (type === 'language') {
        const combined = {};

        for (const { x, y } of data) {
          const key = String(x).toLowerCase().split('-')[0];

          if (combined[key] === undefined) {
            combined[key] = { x: key, y };
          } else {
            combined[key].y += y;
          }
        }

        data = Object.values(combined);
      }

      return ok(res, data);
    }

    if (EVENT_COLUMNS.includes(type)) {
      const column = FILTER_COLUMNS[type] || type;
      const filters = {
        url,
        referrer,
        title,
        query,
        event,
        os,
        browser,
        device,
        country,
        region,
        city,
      };

      filters[type] = undefined;
      const data = await getPageviewMetrics(websiteId, {
        startDate,
        endDate,
        column,
        filters,
      });
      if (column == "url_path") {
        const statMap = (await getUrlStats(websiteId, {
          startDate,
          endDate,
          filters: {
            url,
            referrer,
            title,
            query,
            event,
            os,
            browser,
            device,
            country,
            region,
            city,
          },
        })).reduce(function (map, obj) {
          map[obj["_id"]] = obj;
          return map;
        }, {})
        if(data.length !==0 ) {
          for(const obj of data){
            obj["avgVisitT"] = statMap[obj["x"]]
          }
        }
      }
      return ok(res, data);
    }

    return methodNotAllowed(res);
  }
}
