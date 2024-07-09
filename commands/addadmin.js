import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { readFile, writeFile } from "fs/promises";
config();

const addAdminCommand = new SlashCommandBuilder()
  .setName("addadmin")
  .setDescription("Добавить администратора")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

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

    let filePaths = [];

    if (interaction.guildId === process.env.CIS) {
      filePaths = [
        "/home/kry/ServerFiles/Squad/CUSTOM/cis/SquadGame/ServerConfig/Admins.cfg",
        "/home/kry/ServerFiles/Squad/CUSTOM/RNS1/SquadGame/ServerConfig/Admins.cfg",
        "/home/kry/ServerFiles/Squad/CUSTOM/RNS2/SquadGame/ServerConfig/Admins.cfg",
      ];
    } else if (interaction.guildId === process.env.M1E) {
      filePaths = [
        "/home/kry/ServerFiles/Squad/CUSTOM/m1e/SquadGame/ServerConfig/Admins.cfg",
      ];
    }

    if (filePaths.length === 0) {
      await interaction.editReply({
        content: "Неизвестный сервер. Добавление администратора не выполнено.",
        ephemeral: true,
      });
      return;
    }

    const newAdminLine = `Admin=${steamid64}:${group}\n`;

    for (const filePath of filePaths) {
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
    }

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
