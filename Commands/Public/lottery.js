module.exports = async(client, msg, suffix) => {
	let lottery = await r.table("Lottery");

	// Check if they have an account
	let account = await msg.author.account;

	let id, jackpot, currentNumber, index, totalEntries, lastEntry;

	// Sort entries based on ID
	if (lottery.length < 1) {
		id = 0;
		jackpot = 0;
		currentNumber = 0;
	} else {
		await lottery.sort((a, b) => a.id < b.id ? -1 : 1);
		index = lottery.length - 1;
		lastEntry = lottery[index];
		id = lastEntry.id;
		jackpot = lastEntry.jackpot;
		currentNumber = lastEntry.number;
	}

	let date = new Date();
	let hours = 23 - date.getHours();
	let minutes = 59 - date.getMinutes();
	let seconds = 59 - date.getSeconds();
	let timeLeft = hours ? `${hours}h${minutes}m${seconds}s` : minutes ? `${minutes}m${seconds}s` : `${seconds}s`;


	if (!suffix) {
		let ownedTickets = 0;
		let userEntries = await r.table("Lottery").filter({ userID: msg.author.id });
		for (let entry of userEntries) {
			ownedTickets += entry.tickets;
		}
		let chance;
		if (currentNumber == 0) {
			chance = 0;
		} else {
			chance = Math.round((ownedTickets / currentNumber) * 100);
		}
		msg.channel.send({ embed: {
			color: config.colors.lottery,
			title: "Lottery",
			author: { name: msg.author.tag, icon_url: msg.author.displayAvatarURL() },
			description: `The lottery jackpot consists of all the entries together and is drawn at 00:00 UTC\nType \`>lottery [amount]\` to buy tickets for ${config.lotteryCost} credits each.`,
			fields: [
				{ name: "Your stats", value: `• Your tickets: ${ownedTickets}.\n• Your chance: ${chance}%`, inline: true },
				{ name: "Lottery stats", value: `• Jackpot: ¥${jackpot}.\n• Time left: ${timeLeft}`, inline: true },
			],
		} });
	} else if (/^\d+$/.test(suffix) && !/^0.*/.test(suffix)) {
		let tickets = Number(suffix);
		let cost = tickets * config.lotteryCost;
		let balance = account.balance;
		if (cost > balance) {
			msg.channel.send({ embed: { color: config.colors.error, title: "Payment error", description: "This isn't a charity, get enough money first." } });
		} else {
			balance -= cost;
			await r.table("Accounts").get(msg.author.id).update({ balance: balance });
			let newNumber = currentNumber + tickets;
			let newJackpot = jackpot + cost;
			let newID = id + 1;
			await r.table("Lottery").insert({
				id: newID,
				userID: msg.author.id,
				channel: msg.channel.id,
				jackpot: newJackpot,
				number: newNumber,
				tickets: tickets,
			});
			let ownedTickets = 0;
			let userEntries = await r.table("Lottery").filter({ userID: msg.author.id });
			for (let entry of userEntries) {
				ownedTickets += entry.tickets;
			}
			let chance = Math.round((ownedTickets / newNumber) * 100);
			msg.channel.send({ embed: {
				color: config.colors.lottery,
				title: "Lottery",
				author: { name: msg.author.tag, icon_url: msg.author.displayAvatarURL() },
				description: `You succesfully purchased ${tickets} tickets for ¥${cost}!`,
				fields: [
					{ name: "Your stats", value: `• Your tickets: ${ownedTickets}.\n• Your chance: ${chance}%`, inline: true },
					{ name: "Lottery stats", value: `• Jackpot: ¥${newJackpot}.\n• Time left: ${timeLeft}`, inline: true },
				],
			} });
			client.log(`:tickets: ${msg.author.tag} just bought ${tickets} lottery tickets.`);
		}
	} else {
		msg.channel.send({ embed: { color: config.colors.info, title: "Command usage", description: "What did you just input? Type: `>lottery [amount]` to purchase tickets or `>lottery` to see lottery stats." } });
	}
};
