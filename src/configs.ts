import { frameStyle, popupStyle } from "./DOM";

export const settingsConfig: InitOptions<"textarea"> = {
  id: "telegram-ad-filter",
  frameStyle,
  css: popupStyle,
  title: "Telegram Ad Filter",
  fields: {
    keywords: {
      label: "Filter List",
      type: "textarea",
      default: "#AD, xx云"
    }
  }
};
