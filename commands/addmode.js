import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { readFile, writeFile } from "fs/promises";
config();

const addModeCommand = new SlashCommandBuilder()
  .setName("addmode")
  .setDescription("Добавить мод на сервер")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

addModeCommand.addStringOption((option) =>
  option.setName("modeid").setDescription("Введите ID мода").setRequired(true)
);

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    const modeid = await interaction.options.getString("modeid");
    const modInfo = await getModInfo(modeid);
    const modName = modInfo.title;
    let filePath;
    let shPath;
    let cpCommand;

    if (interaction.guildId === process.env.CIS) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_custom_server2.txt";

      shPath = "/home/kry/UpdateServerScripts/SQUAD/Squad_CUSTOM_Server2.sh";

      cpCommand = `cp -r /home/kry/ServerFiles/Squad/CUSTOM/cis/steamapps/workshop/content/393380/${modeid} /home/kry/ServerFiles/Squad/CUSTOM/cis/SquadGame/Plugins/Mods\n`;
    }

    if (interaction.guildId === process.env.M1E) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_custom_server1.txt";

      shPath = "/home/kry/UpdateServerScripts/SQUAD/Squad_CUSTOM_Server1.sh";

      cpCommand = `cp -r /home/kry/ServerFiles/Squad/CUSTOM/m1e/steamapps/workshop/content/393380/${modeid} /home/kry/ServerFiles/Squad/CUSTOM/m1e/SquadGame/Plugins/Mods\n`;
    }

    if (interaction.guildId === process.env.RNS) {
      filePath =
        "/home/kry/UpdateServerScripts/SQUAD/update_squad_rnm_server1.txt";

      shPath = "/home/kry/UpdateServerScripts/SQUAD/Squad_RNM_Server1.sh";

      cpCommand = `cp -r /home/kry/ServerFiles/Squad/RNM/Server1/steamapps/workshop/content/393380/${modeid} /home/kry/ServerFiles/Squad/RNM/Server1/SquadGame/Plugins/Mods\n`;
    }

    let fileContent = await readFile(filePath, "utf8");

    if (
      fileContent.includes(`workshop_download_item 393380 ${modeid} validate`)
    ) {
      await interaction.editReply({
        content: `Мод ${modName} уже добавлен на сервер.`,
        ephemeral: true,
      });
      return;
    }

    const newLine = `workshop_download_item 393380 ${modeid} validate\n`;

    const appUpdateIndex = fileContent.indexOf("app_update 403240 validate");
    const insertIndex = fileContent.indexOf("\n", appUpdateIndex) + 1;

    fileContent =
      fileContent.slice(0, insertIndex) +
      newLine +
      fileContent.slice(insertIndex);

    await writeFile(filePath, fileContent, "utf8");

    let customServerContent = await readFile(shPath, "utf8");

    customServerContent += cpCommand;

    await writeFile(shPath, customServerContent, "utf8");

    await interaction.editReply({
      content: `Мод ${modName} успешно добавлен на сервер!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Ошибка при выполнении команды:", error);
    await interaction.editReply({
      content: "Произошла ошибка.",
      ephemeral: true,
    });
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
    console.error("Ошибка при получении информации о моде:", error);
    return null;
  }
};

export default { data: addModeCommand, execute };
