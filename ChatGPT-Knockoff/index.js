import dotenv from "dotenv";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { InferenceClient } from "@huggingface/inference";

dotenv.config();

const hfClient = new InferenceClient(process.env.HF_TOKEN);
const prompt = process.env.CUSTOM_PROMPT


const discordClient = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

discordClient.once("ready", () => {
  console.log(`✅ Logged in as ${discordClient.user.tag}`);
});

discordClient.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.toUpperCase().startsWith("ECHO")) {
    const echoContent = message.content.slice(4).trim();
    await message.channel.send(echoContent || "You said: nothing!");
    return;
  }

  if (message.content.toUpperCase().startsWith("GPT")) {
    const mContent = message.content.slice(3).trim();
    if (!mContent) {
      await message.channel.send("❌ Please provide a prompt after 'GPT'.");
      return;
    }
    await message.channel.send("🐻 Replying to: " + mContent);
    await GPT_Feedback(message, 500);
    return;
  }
});

async function GPT_Feedback(message, cooldown) {
  await sleep(cooldown);

  const userPrompt = message.content.slice(3).trim();
  if (!userPrompt) {
    await message.channel.send("❌ Please provide a prompt after 'GPT'.");
    return;
  }

  try {
    const chatCompletion = await hfClient.chatCompletion({
      provider: "novita",
      model: "moonshotai/Kimi-K2-Instruct",
      messages: [
        {
          role: "user",
          content: userPrompt + prompt,
        },
      ],
    });

    const reply = chatCompletion.choices[0].message.content;
    await message.channel.send("🐻 Ivan Bear says:\n" + reply.trim());
  } catch (error) {
    console.error("Inference error:", error);
    await message.channel.send("⚠️ Error while generating response.");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

discordClient.login(process.env.DISCORD_TOKEN);
