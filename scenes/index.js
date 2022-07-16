import { ScenesComposer } from "grammy-scenes";
import start from "./start.js";
import location from "./location.js";
import search from "./search.js";
import notification from "./notification.js";

export const scenes = new ScenesComposer(start, notification, search, location);
