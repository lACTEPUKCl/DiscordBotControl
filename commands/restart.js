import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { exec } from "child_process";
config();

const restartCommand = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Рестарт сервера")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    let servers = [];

    if (interaction.guildId === process.env.CIS) {
      servers = [
        `Squad_CUSTOM_Server2`,
        `Squad_CUSTOM_Server3`,
        `Squad_CUSTOM_Server4`,
      ];
    } else if (interaction.guildId === process.env.M1E) {
      servers = [`Squad_CUSTOM_Server1`];
    }

    if (servers.length > 0) {
      for (const server of servers) {
        exec(`sudo systemctl restart ${server}.service`, (error) => {
          if (error) {
            console.error(`Ошибка при перезагрузке сервера ${server}`, error);
            interaction.editReply({
              content: `Произошла ошибка при перезагрузке сервера ${server}.`,
            });
            return;
          }
        });
      }

      interaction.editReply({
        content: `Серверы успешно перезагружены!`,
      });
    } else {
      interaction.editReply({
        content: `Неизвестный сервер. Перезагрузка не выполнена.`,
      });
    }
  } catch (error) {
    console.error("Ошибка при выполнении команды", error);
    await interaction.editReply({
      content: "Произошла ошибка.",
    });
  }
};

export default { data: restartCommand, execute };
