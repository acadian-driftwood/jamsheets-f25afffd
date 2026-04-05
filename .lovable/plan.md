

# Updated Import Plan: Add Tour Timeline Items

All previous mappings (tours, shows, hotels, contacts, schedule, guest list, operations) remain unchanged. Adding the `tour_timeline_items` table.

## Timeline Items Mapping (old → new)

| Old Column | New Column | Notes |
|---|---|---|
| `id` | `id` | Keep as-is |
| `tour_id` | `tour_id` | Map old `83e29cc2...` → new Jammy Buffet tour ID |
| `item_type` | `type` | `off_day` → `off_day`, `flight_departure` → `flight` |
| `title` | `title` | Keep as-is |
| `starts_at` | `date` + `time_start` | Extract date portion → `date`, time portion → `time_start` (HH:MM) |
| `ends_at` | `time_end` | Extract time portion if not null |
| `location` | `departure_location` | For flights; null for off_days |
| `details` | `notes` | Keep as-is |
| `traveler_name` | `traveler_name` | Keep as-is |
| `airline` | `airline` | Keep as-is |
| `confirmation_number` | `confirmation_number` | Keep as-is |
| `sort_order` | *(dropped)* | Not in new schema |
| *(new)* | `organization_id` | Set to Jammy Buffet org ID |
| *(new)* | `updated_at` | Set to `now()` |

## Data (6 rows)

- 2 flight items (`flight_departure` → `flight`)
- 4 off_day items (type stays `off_day`)

## Implementation

The Python import script (already planned) will include a section for `tour_timeline_items` inserted after tours but before shows (no dependency on shows). The script parses the SQL values, applies the column mapping above, and inserts via `psql`.

No schema changes needed — the `tour_timeline_items` table already supports all mapped columns.

