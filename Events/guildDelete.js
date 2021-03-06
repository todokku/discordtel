const { post } = require("snekfetch");
const auth = require("../Configuration/auth.js");

module.exports = async guild => {
	let name = 	guild.name.replace(/(\*|`|_|~)/, "\\$1").replace(/discord\.(gg|io|me|li)\/([\w\d])+/g, "**Invite Link Censored**").replace(/@(everyone|here)/g, "@\u200b$1");
	client.log(`:outbox_tray: Left guild \`${guild.id}\`(${name}). Currently in ${client.guilds.size} servers on cluster ${client.shard.id}`);
	let numbers = await r.table("Numbers").filter({ guild: guild.id });
	let mailboxes = await r.table("Mailbox").filter({ guild: guild.id });

	// let result = await post(`https://discordbots.org/api/bots/${client.user.id}/stats`)
	// 	.set("Authorization", auth.tokens.bots_org)
	// 	.set("Content-Type", "application/json")
	// 	.send({
	// 		shard_id: client.shard.id,
	// 		shard_count: client.shard.count,
	// 		server_count: client.guilds.size,
	// 	})
	// 	.catch(e => winston.error(`Couldn't post to DBots: ${e}`));

	if (!numbers) return;

	setTimeout(async() => {
		let currGuild = await client.guilds.get(guild.id);
		if (currGuild) return;
		for (let number of numbers) {
			client.log(`📕 Number \`${number.id}\` has automatically been deassigned after leaving \`${guild.id}\`.`);
			r.table("Numbers").get(number.id).delete();
			r.table("Phonebook").get(number.id).delete()
				.catch(e => null);
		}
		for (let mailbox of mailboxes) {
			r.table("Mailbox").get(mailbox.id).delete();
		}
	}, 20 * 60 * 1000);
};
