import dotenv from "dotenv";

import { MongoClient } from "mongodb";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

import { Markup } from "telegraf";

dotenv.config();
// TELEGRAM
const bot = new Telegraf(process.env.BOT_TOKEN);
// MongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    bot.launch();
  } catch (e) {
    console.error("Error connecting to MongoDB", e);
  }
}
bot.start((ctx) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const messageTime = ctx.message.date;

  if (currentTime - messageTime < 10) {
    ctx.reply(
      "Добро пожаловать! Вот что я могу делать:\n\n" +
      "1. По команде `/go <ваш текст>` я сохраняю ваш текст в базу данных. " +
      "Например, отправьте `/go привет мир`, чтобы сохранить сообщение 'привет мир'.\n\n" +
      "2. По команде `/take` я отправлю вам ваше последнее сохранённое сообщение. " +
      "Обратите внимание, что у вас может быть только одно сохранённое сообщение в базе данных, " +
      "которое будет перезаписано при каждом новом использовании команды `/go`."
    );
  }
});

bot.command("go", async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text.split(" ").slice(1).join(" ");

  try {
    const collection = client.db("DatabaseName").collection("CollectionName");
    const filter = { userId: userId };
    const update = { $set: { userId: userId, userMessage: userMessage } };
    const options = { upsert: true };

    await collection.updateOne(filter, update, options);
    ctx.reply("Сообщение сохранено!");
  } catch (e) {
    console.error("Ошибка при сохранении сообщения", e);
    ctx.reply("Ошибка при сохранении сообщения.");
  }
});

bot.command("take", async (ctx) => {
  const userId = ctx.from.id;

  try {
    const collection = client.db("DatabaseName").collection("CollectionName");
    const document = await collection.findOne({ userId: userId });

    if (document) {
      ctx.reply(`Ваше сообщение: ${document.userMessage}`);
    } else {
      ctx.reply("Сообщение не найдено.");
    }
  } catch (e) {
    console.error("Ошибка при извлечении сообщения", e);
    ctx.reply("Ошибка при извлечении сообщения.");
  }
});

connectToMongoDB();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
