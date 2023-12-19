import { random } from '@astrojs/cli-kit/utils';

export default function getFestiveHouston(fancy?: boolean) {
	const date = new Date();
	if (date.getMonth() === 11) {
		// Christmas season
		return {
			clothes: {
				hat: random(['🎁', '🎄', '🌲']),
				tie: '🧣'
			},
			messages: [
				`Ho, ho, ho! 'Tis the season to code and create.`,	
				`Jingle all the way through your web creation journey!`,	
				`Let's unwrap the magic of the web together!`,	
				`Bells are ringing, and so are your creative ideas!`,	
				`It's starting to look a lot like Christmas on the internet.`,	
				`It's time to decorate the web with your festive ideas!`,
			]
		}
	} else if (date.getMonth() === 9) {
		// Spooky season
		return {
			clothes: {
				hat: random(['🎃', '👻', '☠️', '💀']),
				tie: random(['🦴', ''])
			},
			messages: [
				`Booo! Let's scare the interwebs!`,
				`Get ready to haunt the internet with Halloween vibes.`,
				`Harness the power of the web for your frightful ideas.`,
				`It's time to conjure up an online spooktacular masterpiece.`,
				`Prepare for a web of Halloween wonders to be woven.`,
				`Chills and thrills await as you embark on your web journey`,
				`The internet is about to get a whole lot creepier thanks to your new project.`
			]
		}
	}
	// default state
	return {
		clothes: {
			hat: fancy ? random(['🎩', '🎩', '🎩', '🎩', '🎓', '👑', '🧢', '🍦']) : '',
			tie: fancy ? random(['🎀', '🧣']) : '',
		},
		messages: [
			`Let's claim your corner of the internet.`,
			`I'll be your assistant today.`,
			`Let's build something awesome!`,
			`Let's build something great!`,
			`Let's build something fast!`,
			`Let's build the web we want.`,
			`Let's make the web weird!`,
			`Let's make the web a better place!`,
			`Let's create a new project!`,
			`Let's create something unique!`,
			`Time to build a new website.`,
			`Time to build a faster website.`,
			`Time to build a sweet new website.`,
			`We're glad to have you on board.`,
			`Keeping the internet weird since 2021.`,
			`Initiating launch sequence...`,
			`Initiating launch sequence... right... now!`,
			`Awaiting further instructions.`,
		]
	}
}
