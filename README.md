# ReminderBot — Telegram Prayer Time [Reminder Bot](https://t.me/namoz5vbot)

![Telegram Bot](https://img.shields.io/badge/Telegram%20Bot-ReminderBot-blue)
![Version](https://img.shields.io/badge/Version-4.0.0-orange) ![License](https://img.shields.io/badge/License-MIT-green)
![Node](https://img.shields.io/badge/Node.js-24.x-brightgreen)

ReminderBot is a feature-rich Telegram bot that reminds users of daily Islamic prayer times. It works in both **private
chats** and **group chats**, configurable notifications, inline queries, daily hadiths, Quran references, fasting
reminders, regional prayer time search, statistics tracking, and more. Built with **Node.js**, **grammY**, **MongoDB**,
and **TypeScript**.

---

## Key Features

### 🧑 Private Chat

- **Region-based prayer times** — users select their region on first start.
- **Fasting mode** — customized messages for Suhoor (Fajr) and Iftar (Maghrib).
- **Configurable prayer notifications** — individually toggle alerts for Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha.
- **Daily prayer time reminders** sent automatically every morning.
- **Friday special** — a Juma Mubarak image is sent instead of a plain text message on Fridays.
- **Daily Hadith** — a random hadith is appended to every daily reminder.
- **Hadith browser** — browse hadiths interactively.
- **Quran & Tafsir** — access Quran verses and their commentary.
- **Regional search** — fuzzy-search prayer times by city/region name.
- **Location update** — change your region at any time.
- **Feedback** — submit suggestions or complaints directly through the bot.
- **Statistics** — view bot usage and engagement stats.
- **Source** — view the data source used for prayer times.
- **Inline query** — query prayer times from any chat without opening the bot.

### 👥 Group Chat

- **Group registration** — when the bot is added to a group, it automatically starts the region-selection flow.
- **Group region setup** (`GroupStart` scene) — admin selects the group's region via paginated inline keyboard; prayer
  times are shown immediately after selection.
- **Group location update** (`GroupLocation` scene) — change the group's region at any time using `/location`.
- **Daily group reminders** — groups receive the same daily prayer time message as private users (without
  fasting-specific content).
- **Friday Juma image** — groups also receive the Juma Mubarak photo on Fridays.
- **Auto-deactivation** — when the bot is removed from a group, the group is automatically marked inactive and stops
  receiving messages.
- **In-memory group cache** — group data is cached in memory for fast access without repeated DB queries.

---

## Architecture Overview

```
server.ts          — Bot entry point, middleware, command routing, webhook/polling setup
scenes/            — grammY scene handlers (one file per feature flow)
cron/cron.ts       — Scheduled jobs: monthly data fetch, daily reminders, prayer-time alerts
config/database.ts — Mongoose models (User, PrayTime, Hadith, Group)
config/storage.ts  — In-memory key-value store (group cache, daily hadith)
helper/            — Language, replacer, keyboard mapper, error handler, hadith fetcher
keyboard/          — Inline and custom keyboard builders
middlewares/auth.ts— User and group auth middleware (auto-create/load from DB or cache)
query/inline.ts    — Inline query handler
types/             — TypeScript interfaces (database models, bot context)
utils/             — Constants, env validation (Zod), enums, dayjs config
```

---

## Database Design

```mermaid
erDiagram
    USER {
        number  userId          PK "Telegram user ID"
        string  userName            "Telegram username"
        string  name                "First name"
        boolean fasting             "Fasting mode enabled"
        string  region              "Region display name"
        number  regionId            "Region numeric ID"
        number  donate              "Donation amount"
        boolean status              "Active / soft-deleted"
        object  notificationSetting "Per-prayer toggle flags"
        date    deletedAt           "Soft-delete timestamp"
    }

    NOTIFICATION_SETTING {
        boolean fajr
        boolean sunrise
        boolean dhuhr
        boolean asr
        boolean maghrib
        boolean isha
    }

    PRAY_TIME {
        string  region      "Region display name"
        number  regionId    PK "Region numeric ID"
        number  day         PK "Day of month (1–31)"
        number  month       PK "Month (1–12)"
        string  fajr        "Fajr time HH:mm"
        string  sunrise     "Sunrise time HH:mm"
        string  dhuhr       "Dhuhr time HH:mm"
        string  asr         "Asr time HH:mm"
        string  maghrib     "Maghrib time HH:mm"
        string  isha        "Isha time HH:mm"
    }

    HADITH {
        string content  "Hadith text"
        string category "Hadith category/topic"
    }

    GROUP {
        number  groupId     PK "Telegram group/supergroup ID"
        string  groupName   "Group title"
        string  region      "Region display name"
        number  regionId    "Region numeric ID"
        boolean status      "Active (bot is member)"
        string  type        "group | supergroup"
    }

    USER ||--|| NOTIFICATION_SETTING : "has"
    USER }o--|| PRAY_TIME : "regionId matches"
    GROUP }o--|| PRAY_TIME : "regionId matches"
```

---

## Scheduled Jobs (Cron)

| Schedule               | Job                      | Description                                                                                                       |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `30 0 1 * *` (monthly) | `monthly()`              | Fetches prayer time PDFs from the API and refreshes the entire `PrayTime` collection                              |
| `0 1 * * *` (daily)    | `daily()` + `reminder()` | Sends morning prayer time summaries to all active users & groups; reschedules per-prayer alerts                   |
| Per-prayer time        | `reminder()`             | Sends individual prayer-time alerts (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha) based on each region's exact times |

---

## Bot Commands

### Private Chat

| Command         | Description                                     |
| --------------- | ----------------------------------------------- |
| `/start`        | Register and set up region & fasting preference |
| `/location`     | Change your region                              |
| `/notification` | Toggle per-prayer notifications                 |
| `/fasting`      | Toggle fasting mode                             |
| `/search`       | Search prayer times by region name              |
| `/hadith`       | Browse hadiths                                  |
| `/quran`        | Access Quran & Tafsir                           |
| `/source`       | View prayer time data source                    |
| `/statistic`    | View bot statistics                             |
| `/feedback`     | Send feedback to the team                       |

### Group Chat

| Command     | Description                           |
| ----------- | ------------------------------------- |
| `/start`    | Activate the bot in the group         |
| `/location` | Change the group's prayer time region |

---

## Installation

Ensure you have [pnpm](https://pnpm.io/) installed:

```bash
npm install -g pnpm
```

Clone the repository:

```bash
git clone https://github.com/Xayrulloh/ReminderBot.git
cd ReminderBot
```

Install dependencies:

```bash
pnpm install
```

---

## Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable                                | Description                                                      |
| --------------------------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`                              | `dev` or `prod`                                                  |
| `TOKEN`                                 | Telegram Bot API token from [@BotFather](https://t.me/BotFather) |
| `MONGO_URL`                             | MongoDB connection string                                        |
| `PAYME_URL` / `PAYME_ENDPOINT` / `CARD` | Payment integration (optional)                                   |
| `DISCORD_WEBHOOK_URL`                   | Discord webhook for logging                                      |
| `DISCORD_LOGS_THREAD_ID`                | Discord thread ID for general logs                               |
| `DISCORD_FLOOD_THREAD_ID`               | Discord thread ID for flood/unknown messages                     |
| `DISCORD_FEEDBACK_THREAD_ID`            | Discord thread ID for user feedback                              |
| `SESSION_TTL`                           | Session TTL in milliseconds                                      |
| `WEBHOOK_PORT`                          | Port for the Fastify webhook server                              |
| `WEBHOOK_URL`                           | Public HTTPS URL for the webhook                                 |
| `WEBHOOK_ENABLED`                       | `true` to use webhook mode, `false` for long-polling             |
| `LIMIT`                                 | Rate limit (requests per second)                                 |
| `QURON_VA_TAFSIRI_URL`                  | Quran & Tafsir API URL                                           |

---

## Usage

**Development mode** (auto-recompile on change):

```bash
pnpm run start:dev
```

**Production mode** (build then start):

```bash
pnpm run build
pnpm start
```

---

## Tech Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| Runtime         | Node.js 24.x                                  |
| Language        | TypeScript 5.x                                |
| Bot Framework   | [grammY](https://grammy.dev/) + grammy-scenes |
| Database        | MongoDB via Mongoose                          |
| Scheduler       | node-cron + node-schedule                     |
| HTTP Server     | Fastify (webhook mode)                        |
| Logging         | Discord Webhooks (discord.js)                 |
| Validation      | Zod                                           |
| Package Manager | pnpm 10.x                                     |

---

## License

This project is licensed under the MIT License — see the [LICENSE.txt](LICENSE.txt) file for details.

---

> **Security Note:** Never commit your `.env` file or share your bot token publicly. Keep all secrets out of version
> control.
