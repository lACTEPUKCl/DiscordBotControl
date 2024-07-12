import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { spawn } from "child_process";
config();

const restartCommand = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Рестарт сервера")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
let servers = [];
let name;

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.guildId === process.env.CIS) {
      servers = [`custom-2`];
      name = "CIS";
    } else if (
      interaction.guildId === process.env.M1E ||
      interaction.guildId === process.env.RNS
    ) {
      servers = [`custom-1`];
      name = "M1E";
    }

    if (servers.length > 0) {
      for (const server of servers) {
        const down = spawn("docker", ["compose", "down", server], {
          cwd: "/servers",
        });

        down.on("close", (code) => {
          console.log(`down process exited with code ${code}`);
          if (code === 0) {
            const up = spawn("docker", ["compose", "up", server], {
              cwd: "/servers",
            });

            up.on("close", (code) => {
              console.log(`up process exited with code ${code}`);
              if (code === 0) {
                interaction.editReply({
                  content: `Сервер ${name} успешно перезагружен!`,
                });
              } else {
                interaction.editReply({
                  content: `Ошибка при запуске сервера ${name}.`,
                });
              }
            });
          } else {
            interaction.editReply({
              content: `Ошибка при остановке сервера ${name}.`,
            });
          }
        });
      }
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
