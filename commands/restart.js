import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "dotenv";
import { spawn } from "child_process";
config();

const restartCommand = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Рестарт сервера")
  .setDefaultMemberPermissions(PermissionFlagsBits.SendTTSMessages);

let server = "";
let name = "";

const execute = async (interaction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.guildId === process.env.CIS) {
      server = "custom-2";
      name = "CIS";
    } else if (interaction.guildId === process.env.M1E) {
      server = "m1e-1";
      name = "M1E";
    } else if (interaction.guildId === process.env.RNS) {
      const member = interaction.member;
      let folder = "";
      if (member.roles && member.roles.cache) {
        const matchingRole = member.roles.cache.find((role) =>
          /\[(.+?)\]/.test(role.name)
        );
        if (matchingRole) {
          const match = matchingRole.name.match(/\[(.+?)\]/);
          if (match && match[1]) {
            folder = match[1].toLowerCase();
          }
        }
      }
      server = folder;
      name = folder;
    }

    if (server && server.length > 0) {
      const down = spawn("/usr/bin/docker", ["compose", "down", server], {
        cwd: "/root/servers",
      });

      down.on("close", (code) => {
        if (code === 0) {
          const up = spawn("/usr/bin/docker", ["compose", "up", server], {
            cwd: "/root/servers",
          });

          const onData = (data) => {
            const message = data.toString();
            if (message.includes("LogEOSSessionListening")) {
              interaction.editReply({
                content: `Сервер ${name} успешно перезагружен!`,
              });
              up.stdout.removeListener("data", onData);
            }
          };

          up.stdout.on("data", onData);

          up.stderr.on("data", (data) => {
            console.error(`[up stderr]: ${data.toString()}`);
          });

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
