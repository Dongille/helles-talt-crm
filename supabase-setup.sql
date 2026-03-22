-- ================================================================
-- Helles Tält AB – Komplett Supabase-setup
-- Kör hela detta skript i Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qaspfbfcptkwsvhjdfgo/sql/new
-- Klicka "Run" – skriptet är idempotent (kan köras flera gånger).
-- ================================================================


-- ── 1. ORDERS ────────────────────────────────────────────────
-- Primärtabell för alla förfrågningar, bokningar, arkiverade
-- och avbokade poster.  Produktrader lagras som JSONB i "items".
-- Arkiv och fakturering hanteras via status/archived_at/invoiced_at
-- på samma rad – inga separata tabeller behövs.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.orders (

  -- Identitet
  id                          text        primary key,

  -- Status: 'förfrågan' | 'bokning' | 'arkiverad' | 'avbokad'
  status                      text        not null,

  -- Region: 'Göteborg' | 'Skaraborg'
  region                      text        not null,

  -- Tidsstämplar (ISO-8601-strängar, t.ex. "2026-03-21T10:00:00.000Z")
  created_at                  text        not null,
  updated_at                  text        not null,

  -- Kunduppgifter
  first_name                  text        not null default '',
  last_name                   text        not null default '',
  phone                       text        not null default '',
  email                       text        not null default '',
  address                     text        not null default '',
  postal_code                 text        not null default '',
  city                        text        not null default '',

  -- Eventdetaljer
  ground_type                 text        not null default 'Ej angivet',
  -- Möjliga värden: 'Ej angivet' | 'Gräs' | 'Altan' | 'Grus' | 'Asfalt' | 'Inomhus'

  event_date                  text        not null default '',
  -- Format YYYY-MM-DD

  -- Leverans / hämtning
  delivery_date               text,           -- YYYY-MM-DD eller null
  pickup_date                 text,           -- YYYY-MM-DD eller null
  delivery_time               text,           -- t.ex. "10:00" eller null
  pickup_time                 text,           -- t.ex. "16:00" eller null
  self_pickup                 boolean     not null default false,

  -- Produktrader (OrderItem[]) lagrade som JSONB
  -- Varje rad innehåller: productId, productName, category,
  -- quantity, unitPrice, includesMontage, montageUnitPrice,
  -- colorVariant?, isOffertPrice?, subComponents?, includesDishwashing?
  items                       jsonb       not null default '[]',

  -- Ekonomi
  discount_percent            numeric     not null default 0,
  deposit_paid                boolean     not null default false,
  deposit_amount              numeric     not null default 0,

  -- Övrigt
  notes                       text        not null default '',

  -- PDF-status
  quote_pdf_generated         boolean     not null default false,
  confirmation_pdf_generated  boolean     not null default false,

  -- Dokumentnummer (genereras vid PDF-skapande)
  quote_number                integer,
  confirmation_number         integer,

  -- Offertens giltighet
  quote_validity_days         text,
  -- Lagras som sträng: t.ex. "30", "14", eller "custom"
  quote_validity_custom_date  text,           -- YYYY-MM-DD om custom

  -- Arkivering (sätts när status → 'arkiverad' eller 'avbokad')
  archived_at                 text,           -- ISO-8601 eller null

  -- Fakturering (sätts manuellt på faktureringssidan)
  invoiced_at                 text,           -- ISO-8601 eller null

  -- Bokningsstatus (sätts manuellt: 'kommande' | 'färdig')
  booking_status              text        not null default 'kommande'
);

alter table public.orders disable row level security;

-- Lägg till booking_status om kolumnen saknas (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'orders'
      and column_name  = 'booking_status'
  ) then
    alter table public.orders
      add column booking_status text not null default 'kommande';
  end if;
end;
$$;

-- Aktivera Realtime så att ändringar syns direkt i alla flikar
alter publication supabase_realtime add table public.orders;

-- Tvinga PostgREST att ladda om schema-cachen
notify pgrst, 'reload schema';


-- ── 2. INVENTORY ─────────────────────────────────────────────
-- Lagerantal per produkt och region.
-- product_id matchar id-fältet i PRODUCTS-arrayen i koden.
-- Nya produkter läggs till automatiskt via upsert.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.inventory (
  product_id          text    primary key,
  quantity_goteborg   integer not null default 0,
  quantity_skaraborg  integer not null default 0
);

alter table public.inventory disable row level security;


-- ── 3. LOGBOOK ───────────────────────────────────────────────
-- Automatisk logg när lagersaldo når 0 eller återhämtar sig.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.logbook (
  id           text    primary key,
  timestamp    text    not null,
  -- ISO-8601-sträng, t.ex. "2026-03-21T10:00:00.000Z"

  product_id   text    not null,
  product_name text    not null,
  category     text    not null,

  -- 'Göteborg' | 'Skaraborg' | 'Totalt'
  region       text    not null,

  available    integer not null,
  -- Antal tillgängliga vid händelsen (negativa = överbokat)

  -- 'shortage' = noll eller lager | 'resolved' = åtgärdat
  type         text    not null
);

alter table public.logbook disable row level security;


-- ── VERIFIERING ──────────────────────────────────────────────
-- Kör detta sist – resultatet ska visa tre rader:
--   inventory
--   logbook
--   orders
-- ─────────────────────────────────────────────────────────────
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('orders', 'inventory', 'logbook')
order by table_name;
