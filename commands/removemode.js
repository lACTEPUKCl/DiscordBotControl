import { readFile, writeFile } from "fs/promises";
import fetch from "node-fetch";
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { config } from "dotenv";
config();

const removeModeCommand = new SlashCommandBuilder()
  .setName("removemode")
  .setDescription("Удалить мод с сервера")
  .setDefaultMemberPermissions(PermissionFlagsBits.SendTTSMessages);

let envFilePath;
let currentPage = 0;
let clearPages = false;

const execute = async (interaction) => {
  try {
    if (!clearPages) currentPage = 0;

    await interaction.deferReply({ flags: 64 });

    envFilePath = "/root/servers/.env";

    let envFileContent = await readFile(envFilePath, "utf8");

    let customModsKey;
    if (interaction.guildId === process.env.M1E) {
      customModsKey = "M1E_MODS";
    } else if (interaction.guildId === process.env.CIS) {
      customModsKey = "CUSTOM_2_MODS";
    } else if (interaction.guildId === process.env.RNS) {
      const member = interaction.member;
      let roleKey;
      if (member.roles && member.roles.cache) {
        const matchingRole = member.roles.cache.find((role) =>
          /\[(.+?)\]/.test(role.name)
        );
        if (matchingRole) {
          const match = matchingRole.name.match(/\[(.+?)\]/);
          if (match && match[1]) {
            roleKey = match[1];
          }
        }
      }
      customModsKey = roleKey;
    } else {
      await interaction.editReply({
        content: "Эта команда не предназначена для данного сервера.",
        flags: 64,
      });
      return;
    }

    const customModsRegex = new RegExp(`${customModsKey}=\\(([^)]*)\\)`);
    const customModsMatch = envFileContent.match(customModsRegex);
    let customMods = customModsMatch ? customModsMatch[1].split(" ") : [];

    if (customMods.length === 0) {
      await interaction.editReply({
        content: `На сервере не установлены моды в ${customModsKey}.`,
        flags: 64,
      });
      return;
    }

    const buttons = await generateButtons(customMods);
    const row = new ActionRowBuilder().addComponents(buttons);

    await interaction.editReply({
      content: "Выберите мод, который вы хотите удалить:",
      components: [row],
      flags: 64,
    });
  } catch (error) {
    console.error("Ошибка при выполнении команды", error);
    await interaction.editReply({
      content: "Произошла ошибка.",
      flags: 64,
    });
  }
};

const generateButtons = async (customMods) => {
  const buttonsPerPage = 3;
  const totalPages = Math.ceil(customMods.length / buttonsPerPage);

  const startIndex = currentPage * buttonsPerPage;
  const endIndex = Math.min(startIndex + buttonsPerPage, customMods.length);

  const MAX_LABEL_LENGTH = 80;
  const prefix = "";
  const availableLength = MAX_LABEL_LENGTH - prefix.length;

  const buttons = await Promise.all(
    customMods.slice(startIndex, endIndex).map(async (modeId) => {
      const modInfo = await getModInfo(modeId);
      console.log(modInfo);

      let modName = modInfo && modInfo.title ? modInfo.title : modeId;
      if (modName.length > availableLength) {
        modName = modName.slice(0, availableLength - 3) + "...";
      }
      return new ButtonBuilder()
        .setCustomId(`removeMode_${modeId}`)
        .setLabel(prefix + modName)
        .setStyle("Danger");
    })
  );

  if (totalPages > 1 || endIndex < customMods.length) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("nextPage")
        .setLabel("Следующая страница")
        .setStyle("Primary")
    );
  }

  if (startIndex > 0) {
    buttons.unshift(
      new ButtonBuilder()
        .setCustomId("prevPage")
        .setLabel("Предыдущая страница")
        .setStyle("Primary")
    );
  }

  return buttons;
};

const buttonInteraction = async (interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;
  const parts = customId.split("_");

  if (parts[0] === "removeMode") {
    const modeIdToRemove = parts[1];

    try {
      let envFileContent = await readFile(envFilePath, "utf8");

      let customModsKey;
      if (interaction.guildId === process.env.M1E) {
        customModsKey = "M1E_MODS";
      } else if (interaction.guildId === process.env.CIS) {
        customModsKey = "CUSTOM_2_MODS";
      } else if (interaction.guildId === process.env.RNS) {
        const member = interaction.member;
        let roleKey;
        if (member.roles && member.roles.cache) {
          const matchingRole = member.roles.cache.find((role) =>
            /\[(.+?)\]/.test(role.name)
          );
          if (matchingRole) {
            const match = matchingRole.name.match(/\[(.+?)\]/);
            if (match && match[1]) {
              roleKey = match[1];
            }
          }
        }
        customModsKey = roleKey;
      } else {
        await interaction.editReply({
          content: "Эта команда не предназначена для данного сервера.",
          flags: 64,
        });
        return;
      }

      const customModsRegex = new RegExp(`${customModsKey}=\\(([^)]*)\\)`);
      const customModsMatch = envFileContent.match(customModsRegex);
      let customMods = customModsMatch ? customModsMatch[1].split(" ") : [];

      customMods = customMods.filter(
        (id) => id.toString() !== modeIdToRemove.toString()
      );

      const newCustomMods = `${customModsKey}=(${customMods.join(" ")})`;

      envFileContent = envFileContent.replace(customModsRegex, newCustomMods);

      await writeFile(envFilePath, envFileContent, "utf8");

      await interaction.update({
        content: `Мод с ID ${modeIdToRemove} успешно удален с сервера!`,
        components: [],
        flags: 64,
      });
    } catch (error) {
      console.error("Ошибка при удалении мода", error);
      await interaction.update({
        content: "Произошла ошибка при удалении мода.",
        components: [],
        flags: 64,
      });
    }
  } else if (parts[0] === "nextPage") {
    currentPage++;
    clearPages = true;
    await execute(interaction);
  } else if (parts[0] === "prevPage") {
    currentPage--;
    clearPages = true;
    await execute(interaction);
  }
};

const getModInfo = async (modeId) => {
  const apiKey = process.env.STEAM_API;
  const url = `https://api.steampowered.com/IPublishedFileService/GetDetails/v1/?publishedfileids[0]=${modeId}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (
      data.response &&
      Array.isArray(data.response.publishedfiledetails) &&
      data.response.publishedfiledetails.length > 0
    ) {
      return data.response.publishedfiledetails[0];
    } else {
      console.error("Нет данных о моде для modeId:", modeId);
      return null;
    }
  } catch (error) {
    console.error("Ошибка при получении информации о моде", error);
    return null;
  }
};

export default { data: removeModeCommand, execute, buttonInteraction };
