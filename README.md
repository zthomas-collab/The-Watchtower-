# The-Watchtower-
Layer	Tech	Where
UI shell	React 18 + Tailwind	app/ + components/
Routing	Next.js App Router	app/(app)/, app/(marketing)/
Auth	Supabase Auth (email + OAuth)	app/auth/ + lib/supabase/
Database reads	Supabase JS client (anon key)	lib/supabase/client.ts
Server queries	Supabase service role (SSR)	lib/supabase/server.ts
Map	Mapbox GL JS 3 + react-map-gl	components/map/
Charts	Recharts 2 + react-sparklines	components/charts/
Scores	Custom calculator (5 scores)	lib/scores/calculator.ts
ETL	tsx scripts (manual/cron)	etl/ — runs separately
