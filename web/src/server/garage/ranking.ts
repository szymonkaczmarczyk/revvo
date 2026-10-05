import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import type { Vehicle, VehicleStatus } from "@/lib/vehicles";

export const SCORING = {
  flame: 3,
  ownCover: 5,
  photoMax: 5,
  entryMax: 10,
  modMax: 5,
} as const;

export type RankedGarage = Vehicle & {
  rank: number;
  score: number;
  monthFlames: number;
  breakdown: { flames: number; cover: number; photos: number; entries: number; mods: number };
};

type Row = {
  id: string;
  slug: string;
  make: string;
  model: string;
  variant: string | null;
  year: number | null;
  engine: string | null;
  power_hp: number | null;
  paint_code: string | null;
  mileage_km: number | null;
  status: VehicleStatus;
  mods: { category: string; part: string }[];
  cover: string | null;
  catalog_image: string | null;
  owner_name: string;
  owner_role: string;
  total_flames: number;
  month_flames: number;
  own_cover: boolean;
  photos: number;
  entries: number;
};

export async function getGarageRanking(limit = 20): Promise<{ month: string; garages: RankedGarage[] }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("garage-month", "garage");

  const result = await db.execute(sql`
    with month as (
      select (date_trunc('month', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw') as start
    ), stats as (
      select
        v.id, v.slug, v.make, v.model, v.variant, v.year, v.engine, v.power_hp, v.paint_code, v.mileage_km, v.status, v.mods,
        v.cover_image_url as cover, g.image_url as catalog_image, u.name as owner_name, u.role as owner_role,
        (select count(*)::int from flames f where f.target_type = 'vehicle' and f.target_id = v.id) as total_flames,
        (
          (select count(*) from flames f, month where f.target_type = 'vehicle' and f.target_id = v.id and f.created_at >= month.start)
          + (select count(*) from flames f join vehicle_timeline_entries e on e.id = f.target_id, month
             where f.target_type = 'entry' and e.vehicle_id = v.id and f.created_at >= month.start)
        )::int as month_flames,
        (v.cover_image_url is not null and exists (select 1 from vehicle_photos p where p.vehicle_id = v.id and p.timeline_entry_id is null)) as own_cover,
        (select count(*)::int from vehicle_photos p where p.vehicle_id = v.id and p.timeline_entry_id is null) as photos,
        (select count(*)::int from vehicle_timeline_entries e where e.vehicle_id = v.id) as entries
      from vehicles v
      join users u on u.id = v.user_id
      left join car_trims t on t.id = v.car_trim_id
      left join car_series s on s.id = t.serie_id
      left join car_generations g on g.id = s.generation_id
    )
    select *,
      month_flames * ${SCORING.flame}
      + case when own_cover then ${SCORING.ownCover} else 0 end
      + least(photos, ${SCORING.photoMax})
      + least(entries, ${SCORING.entryMax})
      + least(jsonb_array_length(mods), ${SCORING.modMax}) as score
    from stats
    order by score desc, month_flames desc, entries desc, slug
    limit ${limit}
  `);

  const month = new Intl.DateTimeFormat("pl-PL", { month: "long", timeZone: "Europe/Warsaw" }).format(new Date());
  const garages = (result as unknown as (Row & { score: number })[]).map((r, i) => ({
    id: r.id,
    slug: r.slug,
    owner: { name: r.owner_name, verifiedMechanic: r.owner_role === "mechanic" },
    make: r.make,
    model: r.model,
    variant: r.variant ?? "",
    year: r.year,
    engine: r.engine,
    powerHp: r.power_hp,
    paintCode: r.paint_code,
    mileageKm: r.mileage_km,
    status: r.status,
    photo: r.cover ?? r.catalog_image,
    photoIsCatalog: !r.cover && !!r.catalog_image,
    flames: r.total_flames,
    mods: r.mods,
    timeline: [],
    rank: i + 1,
    score: Number(r.score),
    monthFlames: r.month_flames,
    breakdown: {
      flames: r.month_flames * SCORING.flame,
      cover: r.own_cover ? SCORING.ownCover : 0,
      photos: Math.min(r.photos, SCORING.photoMax),
      entries: Math.min(r.entries, SCORING.entryMax),
      mods: Math.min(r.mods.length, SCORING.modMax),
    },
  }));
  return { month, garages };
}

export async function getPopularSetups(limit = 6) {
  "use cache";
  cacheLife("hours");
  cacheTag("garage");
  const result = await db.execute(sql`
    select min(m->>'part') as part, min(m->>'category') as category, count(distinct v.id)::int as vehicles
    from vehicles v, jsonb_array_elements(v.mods) m
    group by lower(trim(m->>'part'))
    order by vehicles desc, part
    limit ${limit}
  `);
  return result as unknown as { part: string; category: string; vehicles: number }[];
}
