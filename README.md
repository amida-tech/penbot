
#@penbot

####A simple Slack bot to manage 'the pen.'

At [Amida](http://www.amida.com/), we often work as teams writing documentation and reports, working together and in parallel. This can create issues in version control when we find ourselves reconciling two documents manually. To address this, we pass around 'the pen'. Whoever has the pen is in control of the master document being worked on at that time.

####Rules of the pen:

- Only one person may have the pen at any time.
- You may not 'take' the pen, you can only pick it up if it is not in use.
- You may not 'give' the pen. You can only set it down for someone else to pick up.
- If the pen is with someone who isn't on Slack, someone from the team should hold it until that person has finished their edits.
- There are exceptional cases where the pen is in the hands of someone who accidentally still has the pen, and that person is AFK or on vacation, etc. In this case, you must steal the pen.
  - You must notify the person that you are stealing the pen from them via email, and copy everyone working on the document.
  - If you steal the pen erroneously, you assume responsibility for everything you have broken as a result of your theivery.

####Talking to @penbot:

If you want to use @penbot, start a channel in Slack and add the user @penbot to it, @penbot manages the pen by channel.

Say @penbot help for a list of commands. Including various keywords in your message to @penbot is how you move the pen around. Default commands:

	@penbot [mine, take, me, grab] - Takes the pen if it is available.
	@penbot [done, down, drop] - Sets the pen down if you have it.
	@penbot [who, where] - Tells you where the pen is at.
	@penbot [steal] - Steals the pen from whoever has it, if someone has it.
    @penbot [help] - Lists the commands for @penbot.
    @penbot [hello, hi] - Say hi to penbot.

####Deployment:

Penbot is written in [Node.js](https://nodejs.org), using [Botkit](https://github.com/howdyai/botkit/).

First you need to register the Bot with Slack and attain an API token.  To do this, follow the instructions [here](https://github.com/howdyai/botkit/blob/master/readme-slack.md#getting-started).

The API token is maintained in a .env file. Rename env.sample to .env and replace the ```BOT_API_KEY``` value with your API key.

That's it. You should be good to run it using ```node penbot.js```.

Licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
