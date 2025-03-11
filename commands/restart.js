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
      let folder;
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
      console.log(folder);
    } else {
      await interaction.editReply({
        content: `Неизвестный сервер. Перезагрузка не выполнена.`,
      });
      return;
    }

    if (server.length > 0) {
      console.log(`Запуск команды: docker compose stop ${server}`);
      const stop = spawn(
        "/usr/bin/docker",
        ["compose", "stop", server],
        { cwd: "/root/servers" }
      );

      stop.stdout.on("data", (data) => {
        console.log(`[stop stdout]: ${data.toString()}`);
      });
      stop.stderr.on("data", (data) => {
        console.error(`[stop stderr]: ${data.toString()}`);
      });

      stop.on("close", (code) => {
        console.log(`Команда down завершилась с кодом ${code}`);
        if (code === 0) {
          console.log(`Запуск команды: docker compose up ${server}`);
          const up = spawn(
            "/usr/bin/docker",
            ["compose", "up", server],
            { cwd: "/root/servers" }
          );

          up.stdout.on("data", (data) => {
            const message = data.toString();
            if (message.includes("GameSession")) {
              interaction.editReply({
                content: `Сервер ${name} успешно перезагружен!`,
              });
              up.stdout.off("data");
            }
          });
          up.stderr.on("data", (data) => {
            console.error(`[up stderr]: ${data.toString()}`);
          });
          up.on("close", (code) => {
            console.log(`Команда up завершилась с кодом ${code}`);
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
