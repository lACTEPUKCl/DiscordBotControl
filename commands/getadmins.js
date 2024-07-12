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
  .setDescription("Получить список администраторов и камер")
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

    if (interaction.guildId === process.env.M1E) {
      filePath = "/root/servers/serverscfg/custom-1/Admins.cfg";
    }

    let fileContent = await readFile(filePath, "utf8");

    const lines = fileContent.split("\n");

    let admins = [];
    let cameras = [];

    lines.forEach((line) => {
      const adminMatches = line.match(/Admin=(\d+):Admin/);
      if (adminMatches && adminMatches[1]) {
        admins.push(adminMatches[1]);
      }
      const cameraMatches = line.match(/Admin=(\d+):Camera/);
      if (cameraMatches && cameraMatches[1]) {
        cameras.push(cameraMatches[1]);
      }
    });

    const fetchSteamProfiles = async (ids) => {
      const profiles = [];
      for (const id of ids) {
        try {
          const responseSteam = await fetch(
            `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApi}&steamids=${id}`
          );
          const dataSteam = await responseSteam.json();
          if (
            dataSteam.response &&
            dataSteam.response.players &&
            dataSteam.response.players.length > 0
          ) {
            profiles.push({
              name: dataSteam.response.players[0].personaname,
              id,
            });
          }
        } catch (error) {
          console.error(
            "Ошибка при получении информации о пользователе Steam:",
            error
          );
        }
      }
      return profiles;
    };

    const adminProfiles = await fetchSteamProfiles(admins);
    const cameraProfiles = await fetchSteamProfiles(cameras);

    const embed = new EmbedBuilder()
      .setTitle("Список администраторов")
      .setColor(0x0099ff)
      .setTimestamp();

    let adminDescription = "**Администраторы:**\n";
    adminProfiles.forEach((admin) => {
      adminDescription += `**${admin.name}**: ${admin.id}\n`;
    });

    let cameraDescription = "\n**Камеры:**\n";
    cameraProfiles.forEach((camera) => {
      cameraDescription += `**${camera.name}**: ${camera.id}\n`;
    });

    embed.setDescription(adminDescription + cameraDescription);

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
