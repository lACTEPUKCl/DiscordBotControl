import { readFile, writeFile, rm } from "fs/promises";
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
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

let filePath;
let shPath;
let currentPage = 0;
let clearPages = false;

const execute = async (interaction) => {
  try {
    if (!clearPages) currentPage = 0;

    await interaction.deferReply({ ephemeral: true });

    if (interaction.guildId === process.env.CIS) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_custom_server2.txt";
    } else if (interaction.guildId === process.env.M1E) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_custom_server1.txt";
    } else if (interaction.guildId === process.env.RNS) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_rnm_server1.txt";
    } else {
      await interaction.editReply({
        content: "Не удалось определить путь к файлу.",
        ephemeral: true,
      });
      return;
    }

    let fileContent = await readFile(filePath, "utf8");
    const modeLines = fileContent.match(
      /workshop_download_item 393380 (\d+) validate\n/g
    );

    if (!modeLines || modeLines.length === 0) {
      await interaction.editReply({
        content: "На сервере не установлены моды.",
        ephemeral: true,
      });
      return;
    }

    const buttons = await generateButtons(modeLines);
    const row = new ActionRowBuilder().addComponents(buttons);

    await interaction.editReply({
      content: "Выберите мод, который вы хотите удалить:",
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Ошибка при выполнении команды", error);
    await interaction.editReply({
      content: "Произошла ошибка.",
      ephemeral: true,
    });
  }
};

const generateButtons = async (modeLines) => {
  const buttonsPerPage = 3;
  const totalPages = Math.ceil(modeLines.length / buttonsPerPage);

  const startIndex = currentPage * buttonsPerPage;
  const endIndex = Math.min(startIndex + buttonsPerPage, modeLines.length);

  const buttons = await Promise.all(
    modeLines.slice(startIndex, endIndex).map(async (line) => {
      const modeId = line.match(
        /workshop_download_item 393380 (\d+) validate\n/
      )[1];
      const modInfo = await getModInfo(modeId);
      const modName = modInfo.title;
      return new ButtonBuilder()
        .setCustomId(`removeMode_${modeId}`)
        .setLabel(`Удалить мод ${modName || modeId}`)
        .setStyle("Danger");
    })
  );

  if (totalPages > 1 || endIndex < modeLines.length) {
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
  let cpCommandToRemove;
  if (!interaction.isButton()) return;

  const customId = interaction.customId;
  const parts = customId.split("_");

  if (parts[0] === "removeMode") {
    const modeIdToRemove = parts[1];

    let modDirectoryPath;
    if (interaction.guildId === process.env.CIS) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_custom_server2.txt";
      cpCommandToRemove = `cp -r /home/kry/ServerFiles/Squad/CUSTOM/cis/steamapps/workshop/content/393380/${modeIdToRemove} /home/kry/ServerFiles/Squad/CUSTOM/cis/SquadGame/Plugins/Mods\n`;
      shPath = "/home/kry/UpdateServerScripts/SQUAD/Squad_CUSTOM_Server2.sh";
      modDirectoryPath = `/home/kry/ServerFiles/Squad/CUSTOM/cis/SquadGame/Plugins/Mods/${modeIdToRemove}`;
    } else if (interaction.guildId === process.env.M1E) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_custom_server1.txt";
      cpCommandToRemove = `cp -r /home/kry/ServerFiles/Squad/CUSTOM/m1e/steamapps/workshop/content/393380/${modeIdToRemove} /home/kry/ServerFiles/Squad/CUSTOM/m1e/SquadGame/Plugins/Mods\n`;
      shPath = "/home/kry/UpdateServerScripts/SQUAD/Squad_CUSTOM_Server1.sh";
      modDirectoryPath = `/home/kry/ServerFiles/Squad/CUSTOM/m1e/SquadGame/Plugins/Mods/${modeIdToRemove}`;
    } else if (interaction.guildId === process.env.RNS) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_rnm_server1.txt";
      cpCommandToRemove = `cp -r /home/kry/ServerFiles/Squad/RNM/Server1/steamapps/workshop/content/393380/${modeIdToRemove} /home/kry/ServerFiles/Squad/RNM/Server1/SquadGame/Plugins/Mods\n`;
      shPath = "/home/kry/UpdateServerScripts/SQUAD/Squad_RNM_Server1.sh";
      modDirectoryPath = `/home/kry/ServerFiles/Squad/RNM/Server1/SquadGame/Plugins/Mods/${modeIdToRemove}`;
    }

    try {
      let fileContent = await readFile(filePath, "utf8");
      const modeLineToRemove = `workshop_download_item 393380 ${modeIdToRemove} validate\n`;

      fileContent = fileContent.replace(modeLineToRemove, "");

      await writeFile(filePath, fileContent, "utf8");

      let shFileContent = await readFile(shPath, "utf8");

      shFileContent = shFileContent.replace(cpCommandToRemove, "");

      await writeFile(shPath, shFileContent, "utf8");

      await rm(modDirectoryPath, { recursive: true, force: true });

      await interaction.update({
        content: `Мод с ID ${modeIdToRemove} успешно удален с сервера!`,
        components: [],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Ошибка при удалении мода");
      await interaction.update({
        content: "Произошла ошибка при удалении мода.",
        components: [],
        ephemeral: true,
      });
    }
  } else if (parts[0] === "nextPage") {
    currentPage++;
    await execute(interaction, currentPage, (clearPages = true)); // Передаем текущую страницу в функцию execute
  } else if (parts[0] === "prevPage") {
    currentPage--;
    await execute(interaction, currentPage, (clearPages = true)); // Передаем текущую страницу в функцию execute
  }
};

const getModInfo = async (modeId) => {
  const apiKey = process.env.STEAM_API;
  const url = `https://api.steampowered.com/IPublishedFileService/GetDetails/v1/?publishedfileids[0]=${modeId}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.response.publishedfiledetails[0];
  } catch (error) {
    console.error("Ошибка при получении информации о моде");
    return null;
  }
};

export default { data: removeModeCommand, execute, buttonInteraction };
