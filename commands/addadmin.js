import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { readFile, writeFile } from "fs/promises";
config();

const addAdminCommand = new SlashCommandBuilder()
  .setName("addadmin")
  .setDescription("Добавить администратора")
  .setDefaultMemberPermissions(PermissionFlagsBits.SendTTSMessages);

addAdminCommand.addStringOption((option) =>
  option
    .setName("steamid64")
    .setDescription("Введите SteamID64")
    .setRequired(true)
    .setMaxLength(17)
    .setMinLength(17)
);

addAdminCommand.addStringOption((option) =>
  option
    .setName("group")
    .setDescription("Выберите группу")
    .setRequired(true)
    .addChoices(
      {
        name: "Админ",
        value: "Admin",
      },
      {
        name: "Камера",
        value: "Camera",
      }
    )
);

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    const steamid64 = interaction.options.getString("steamid64");
    const group = interaction.options.getString("group");

    let filePath = "";

    if (interaction.guildId === process.env.CIS) {
      filePath = "/root/servers/serverscfg/custom-2/Admins.cfg";
    }
    if (interaction.guildId === process.env.RNS) {
      const member = interaction.member;
      let roleFolder;

      if (member.roles && member.roles.cache) {
        const matchingRole = member.roles.cache.find((role) =>
          /\[(.+?)\]/.test(role.name)
        );
        if (matchingRole) {
          const match = matchingRole.name.match(/\[(.+?)\]/);
          if (match && match[1]) {
            roleFolder = match[1].toLowerCase();
          }
        }
      }
      filePath = `/root/servers/serverscfg/${roleFolder}/Admins.cfg`;
    }
    if (interaction.guildId === process.env.M1E) {
      filePath = "/root/servers/serverscfg/m1e-1/Admins.cfg";
    }

    if (!filePath) {
      await interaction.editReply({
        content: "Неизвестный сервер. Добавление администратора не выполнено.",
        ephemeral: true,
      });
      return;
    }

    const newAdminLine = `Admin=${steamid64}:${group}\n`;
    let fileContent = await readFile(filePath, "utf8");

    if (fileContent.includes(newAdminLine)) {
      await interaction.editReply({
        content: `Администратор с SteamID64 ${steamid64} и группой ${group} уже существует на сервере!`,
        ephemeral: true,
      });
      return;
    }

    fileContent += newAdminLine;
    await writeFile(filePath, fileContent, "utf8");

    await interaction.editReply({
      content: `Админ успешно добавлен на сервер!`,
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

export default { data: addAdminCommand, execute };
