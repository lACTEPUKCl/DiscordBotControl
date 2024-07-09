import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { exec } from "child_process";
import { promisify } from "util"; // Импортируем функцию promisify для преобразования exec в промис
config();

const execPromise = promisify(exec); // Преобразуем exec в промис

const updateCommand = new SlashCommandBuilder()
  .setName("updateserver")
  .setDescription("Обновить сервер")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

let filePaths = [];
let servers = [];
const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.guildId === process.env.CIS) {
      filePaths = [
        `/home/kry/UpdateServerScripts/SQUAD/Squad_CUSTOM_Server2.sh`,
        `/home/kry/UpdateServerScripts/SQUAD/Squad_CUSTOM_Server3.sh`,
        `/home/kry/UpdateServerScripts/SQUAD/Squad_CUSTOM_Server4.sh`,
      ];
      servers = [
        `Squad_CUSTOM_Server2`,
        `Squad_CUSTOM_Server3`,
        `Squad_CUSTOM_Server4`,
      ];
    }

    if (interaction.guildId === process.env.M1E) {
      filePaths = [
        `/home/kry/UpdateServerScripts/SQUAD/Squad_CUSTOM_Server1.sh`,
      ];
      servers = [`Squad_CUSTOM_Server1`];
    }

    if (interaction.guildId === process.env.RNS) {
      filePaths = [`/home/kry/UpdateServerScripts/SQUAD/Squad_RNM_Server1.sh`];
      servers = [`Squad_RNM_Server1`];
    }

    for (let i = 0; i < filePaths.length; i++) {
      await execPromise(filePaths[i]);
      await execPromise(`sudo systemctl restart ${servers[i]}.service`);
    }

    await interaction.editReply({
      content: `Сервер успешно обновлен и перезапущен!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Ошибка при выполнении команды:", error);
    await interaction.reply({
      content: "Произошла ошибка.",
      ephemeral: true,
    });
  }
};

export default { data: updateCommand, execute };
