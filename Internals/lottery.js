const { scheduleJob } = require("node-schedule");

// does this work?
Number(process.env.SHARD_ID) === 0 && scheduleJob({ date: 1, hour: 0, minute: 0, second: 0 }, async() => {
	// Daily reset
	await r.table("Accounts").update({ daily: false });

	// Lottery winner & reset
	let lottery = await r.table("Lottery");
	await r.table("Lottery").delete();
	await lottery.sort((a, b) => a.id < b.id ? -1 : 1);
	let lastEntry = lottery[lottery.length - 1];
	let winningNumber = Math.round(Math.random() * lastEntry.id) + 1;

	let winnerID;
	for (let i in lottery) {
		// find winner
		if (lottery[i].number >= winningNumber) {
			winnerID = lottery[i].userID;
			console.log(`Winning Number: ${winningNumber}, winning ID: ${lottery[i].id}, winning person: ${winnerID}`);
			break;
		}
	}

	let account = await r.table("Accounts").get(winnerID).default(null);
	let balance = account.balance;
	balance += lastEntry.jackpot;
	await r.table("Accounts").get(winnerID).update({ balance: balance });
	let user = await client.users.fetch(winnerID);

	user.send(`CONGRATS! You won the jackpot of ${lastEntry.jackpot} credits.`);
	client.log(`:white_check_mark: The lottery and dailies have been reset.`);
});
