# ReminderBot - Telegram Prayer Time Reminder Bot

![Telegram Bot](https://img.shields.io/badge/Telegram%20Bot-ReminderBot-blue)
![License](https://img.shields.io/badge/License-MIT-green)

ReminderBot is a versatile Telegram bot designed to remind people of prayer times, offering an array of features to enhance the user experience. It supports multiple languages, configurable notifications, feedback collection, regional prayer time searches, daily prayer time reminders, customizable fasting reminders, regional reminders, statistics tracking, and more. This bot is built using Node.js and relies on the Telegram Bot API for communication.

## Key Features

- Multi-language support for a global user base.
- Configurable prayer time notifications and reminders.
- User feedback collection to improve the bot's functionality.
- Regional search for prayer times by user location.
- Daily prayer time reminders for personalized alerts.
- Configurable fasting reminders to accommodate different fasting schedules.
- Regional reminders to provide location-specific information.
- Statistics tracking to monitor bot usage and engagement.

## Installation

Ensure you have [pnpm](https://pnpm.io/) installed. You can install it globally using npm:

```bash
npm install -g pnpm
```

Clone the repository to your local machine:

```bash
git clone https://github.com/Xayrulloh/ReminderBot.git
```

Navigate to the project directory:

```bash
cd ReminderBot
```

Install the project dependencies using pnpm:

```bash
pnpm install
```

## Configuration

To use ReminderBot, you need to set up a Telegram Bot and obtain the API token. Follow these steps:

1. Create a Telegram Bot using [BotFather](https://core.telegram.org/bots#botfather).
2. Copy the API token provided by BotFather.
3. Create a `.env` file in the project directory with the following content:

```
TOKEN=YOUR_BOT_API_TOKEN
```

Replace `TOKEN` with the actual API token you obtained from BotFather.

## Usage

To start the bot in development mode:

```bash
pnpm run start:dev
```

To build and start the bot in production mode:

```bash
pnpm run build
pnpm start
```

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

---

**Note:** Always keep your API token and sensitive information secure. Do not share them in your public repositories or expose them to unauthorized users.

Feel free to contribute, report issues, or suggest improvements by creating pull requests or opening issues.
```

Replace `Xayrulloh` in the `git clone` URL with your actual GitHub username or the repository URL where you plan to host the project.

Make sure to create a `LICENSE.md` file with the MIT License text or include a link to the official MIT License page in your repository.