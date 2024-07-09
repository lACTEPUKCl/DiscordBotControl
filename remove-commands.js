import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "dotenv";
config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await client.guilds.cache
    .get(process.env.CIS)
    .commands.fetch()
    .then((commands) => {
      commands.forEach((command) => {
        command.delete();
      });
    });

  await client.guilds.cache
    .get(process.env.RNS)
    .commands.fetch()
    .then((commands) => {
      commands.forEach((command) => {
        command.delete();
      });
    });

  await client.guilds.cache
    .get(process.env.M1E)
    .commands.fetch()
    .then((commands) => {
      commands.forEach((command) => {
        command.delete();
      });
    });
  console.log("Existing commands deleted.");
  await client.destroy();
});

client.login(process.env.CLIENT_TOKEN);
