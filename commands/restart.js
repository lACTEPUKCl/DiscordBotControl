import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { spawn } from "child_process";
config();

const restartCommand = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Рестарт сервера")
  .setDefaultMemberPermissions(PermissionFlagsBits.SendTTSMessages);
let servers = [];
let name;

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.guildId === process.env.CIS) {
      servers = [`custom-2`];
      name = "CIS";
    }
    if (interaction.guildId === process.env.M1E) {
      servers = [`m1e-1`];
      name = "M1E";
    }
    if (interaction.guildId === process.env.RNS) {
      const member = interaction.member;
      let folder;
      if (member.roles && member.roles.cache) {
        const matchingRole = member.roles.cache.find((role) =>
          /\[(.+?)\]/.test(role.name)
        );
        if (matchingRole) {
          const match = matchingRole.name.match(/\[(.+?)\]/);
          if (match && match[1]) {
            folder = match[1];
          }
        }
      }
      servers = [folder];
      name = [folder];
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

        down.on("close", (code) => {
          if (code === 0) {
            const up = spawn(
              "/usr/bin/docker",
              ["compose", "--env-file", "./custom/.env", "up", server],
              {
                cwd: "/root/servers",
              }
            );

            const handleUpData = (data) => {
              const message = data.toString();

              if (message.includes("LogEOSSessionListening")) {
                interaction.editReply({
                  content: `Сервер ${name} успешно перезагружен!`,
                });

                up.stdout.off("data", handleUpData);
              }
            };

            up.stdout.on("data", handleUpData);

            up.on("close", (code) => {
              if (code !== 0) {
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
