import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { config } from "dotenv";
import { readFile } from "fs/promises";
import fetch from "node-fetch";
config();

const getAdmins = new SlashCommandBuilder()
  .setName("getadmins")
  .setDescription("Получить список администраторов")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    let filePath;
    let steamApi = process.env.STEAM_API;

    if (interaction.guildId === process.env.CIS) {
      filePath = "/root/servers/serverscfg/custom-2/Admins.cfg";
    }

    if (interaction.guildId === process.env.RNS) {
      filePath = "/root/servers/serverscfg/custom-1/Admins.cfg";
    }

    let fileContent = await readFile(filePath, "utf8");

    const lines = fileContent.split("\n");

    let admins = [];

    lines.forEach((line) => {
      const matches = line.match(/Admin=(\d+):Admin/);
      if (matches && matches[1]) {
        admins.push(matches[1]);
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("Список администраторов")
      .setColor(0x0099ff)
      .setTimestamp();

    let description = "";
    for (const admin of admins) {
      try {
        const responseSteam = await fetch(
          `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApi}&steamids=${admin}`
        );
        const dataSteam = await responseSteam.json();
        if (
          dataSteam.response &&
          dataSteam.response.players &&
          dataSteam.response.players.length > 0
        ) {
          const player = dataSteam.response.players[0];
          description += `**${player.personaname}**: ${admin}\n`;
        }
      } catch (error) {
        console.error(
          "Ошибка при получении информации о пользователе Steam:",
          error
        );
      }
    }

    embed.setDescription(description);

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error("Ошибка при выполнении команды:", error);
    await interaction.editReply({
      content: "Произошла ошибка.",
      ephemeral: true,
    });
  }
};

export default { data: getAdmins, execute };
