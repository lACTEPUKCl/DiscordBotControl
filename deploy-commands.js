import { Client, GatewayIntentBits, Events } from "discord.js";
import getCommands from "./commands/getCommands.js";
import { config } from "dotenv";
config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = await getCommands();
  for (let command of commands) {
    command = command.data.toJSON();
    await client.guilds.cache.get(process.env.CIS).commands.create(command);
    await client.guilds.cache.get(process.env.RNS).commands.create(command);
    await client.guilds.cache.get(process.env.M1E).commands.create(command);
  }
  await client.destroy();
});

client.login(process.env.CLIENT_TOKEN);
