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
        const down = spawn(
          "/usr/bin/docker",
          ["compose", "--env-file", "./custom/.env", "down", server],
          {
            cwd: "/root/servers",
          }
        );

        down.stdout.on("data", (data) => {
          console.log(`down stdout: ${data}`);
        });

        down.stderr.on("data", (data) => {
          console.error(`down stderr: ${data}`);
        });

        down.on("close", (code) => {
          console.log(`down process exited with code ${code}`);
          if (code === 0) {
            const up = spawn(
              "/usr/bin/docker",
              ["compose", "--env-file", "up", server],
              {
                cwd: "/root/servers",
              }
            );

            up.stdout.on("data", (data) => {
              console.log(`up stdout: ${data}`);
            });

            up.stderr.on("data", (data) => {
              console.error(`up stderr: ${data}`);
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
