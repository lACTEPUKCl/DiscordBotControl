import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { readFile, writeFile } from "fs/promises";
config();

const removeAdminCommand = new SlashCommandBuilder()
  .setName("removeadmin")
  .setDescription("Удалить администратора")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

removeAdminCommand.addStringOption((option) =>
  option
    .setName("steamid64")
    .setDescription("Введите SteamID64 администратора для удаления")
    .setRequired(true)
    .setMaxLength(17)
    .setMinLength(17)
);

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    const steamid64ToRemove = interaction.options.getString("steamid64");

    let filePaths = [];

    if (interaction.guildId === process.env.CIS) {
      filePaths = ["/root/servers/serverscfg/custom-2/Admins.cfg"];
    }
    if (interaction.guildId === process.env.RNS) {
      filePaths = ["/root/servers/serverscfg/custom-1/Admins.cfg"];
    }
    if (interaction.guildId === process.env.M1E) {
      filePaths = ["/root/servers/serverscfg/custom-1/Admins.cfg"];
    }

    if (filePaths.length === 0) {
      await interaction.editReply({
        content: "Неизвестный сервер. Удаление администратора не выполнено.",
        ephemeral: true,
      });
      return;
    }

    for (const filePath of filePaths) {
      let fileContent = await readFile(filePath, "utf8");

      const lines = fileContent.split("\n");

      const filteredLines = lines.filter(
        (line) => !line.includes(`Admin=${steamid64ToRemove}:`)
      );

      const newFileContent = filteredLines.join("\n");

      await writeFile(filePath, newFileContent, "utf8");
    }

    await interaction.editReply({
      content: `Администратор с SteamID64 ${steamid64ToRemove} успешно удален с сервера!`,
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

export default { data: removeAdminCommand, execute };
