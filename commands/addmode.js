import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { readFile, writeFile } from "fs/promises";
config();

const addModeCommand = new SlashCommandBuilder()
  .setName("addmode")
  .setDescription("Добавить мод на сервер")
  .setDefaultMemberPermissions(PermissionFlagsBits.SendTTSMessages);

addModeCommand.addStringOption((option) =>
  option.setName("modeid").setDescription("Введите ID мода").setRequired(true)
);

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    const modeid = interaction.options.getString("modeid");
    const modInfo = await getModInfo(modeid);
    const modName = modInfo.title;

    const envFilePath = "/root/servers/.env";
    const envFileContent = await readFile(envFilePath, "utf8");

    let customModsKey;
    if (interaction.guildId === process.env.M1E) {
      customModsKey = "M1E_MODS";
    }
    if (interaction.guildId === process.env.CIS) {
      customModsKey = "CUSTOM_2_MODS";
    }
    if (interaction.guildId === process.env.RNS) {
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
      customModsKey = `${roleKey}`;
    } else {
      await interaction.editReply({
        content: "Эта команда не предназначена для данного сервера.",
        ephemeral: true,
      });
      return;
    }

    const customModsRegex = new RegExp(`${customModsKey}=\\(([^)]*)\\)`);
    const customModsMatch = envFileContent.match(customModsRegex);
    let customMods = customModsMatch
      ? customModsMatch[1].split(" ").filter(Boolean)
      : [];

    if (customMods.includes(modeid)) {
      await interaction.editReply({
        content: `Мод ${modName} уже добавлен в ${customModsKey}.`,
        ephemeral: true,
      });
      return;
    }

    customMods.push(modeid);
    const newCustomMods = `${customModsKey}=(${customMods.join(" ")})`;

    const updatedEnvFileContent = envFileContent.replace(
      customModsRegex,
      newCustomMods
    );

    await writeFile(envFilePath, updatedEnvFileContent, "utf8");

    await interaction.editReply({
      content: `Мод ${modName} успешно добавлен в ${customModsKey}!`,
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
