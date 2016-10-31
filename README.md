
#@penbot

####A simple Slack bot to manage 'the pen'.

At Amida, we often work as teams writing documentation and reports, working together and in parallel. This can create issues in version control when we find ourselves reconciling two documents manually. To address this, we pass around 'the pen'. Whoever has the pen is in control of the master document being worked on at that time.

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

####Deployment:

Penbot is written in Node, using [Botkit](https://github.com/howdyai/botkit/).

.env file has API key.

Written using botkit.



If you want the pen, say @penbot and a sentence with the word 'up' in it. If it isn't held by someone, you get the pen.

If you are done with the pen, say @penbot and a sentence with the word 'down' in it.  If you have the pen, you will set it down.

If you want to know whwere the pen is, say @penbot and a sentence with the word 'who' in it.  It will tell you who has the pen.