---
title: What should we build?
description: “What should we build?” is three questions, not one. Product, design and engineering each spent decades learning to answer one of them.
date: 2026-09-26
kicker: A timeline · Product × Experience
tags: ["Product", "UX"]
layout: layouts/post.njk
header: default
---

Product managers, designers and engineers spend a lot of time arguing about who decides what gets built. Most of that argument comes from treating it as one decision.

{% timeline "what-should-we-build" %}
“What should we build?” sounds like one question. It's three. Do people want it? Can it be built? Will enough of them pay for it? The first is about people, the second about technology and the third about the market, and each takes a different kind of evidence to answer.

The popular answer to who decides gives all three to one person. In a memo written at Netscape in the mid-1990s, Ben Horowitz described the good product manager as “the CEO of the product”. The phrase has outlived the memo, and so has the idea that what gets built is the product manager's call.

The history says otherwise. Product management and experience design grew up apart, each learning to judge one of those questions, while engineering judged the third. As you read, watch which question each lane is asking, even when it borrows the other's methods.

---

Read back along the lanes and each one is learning to judge one kind of evidence. Product's is demand: Nielsen measuring what sells, the focus group hearing what persuades, customer development asking what people will pay for. Experience design's is behaviour: human factors in the cockpit, think-aloud in the lab, contextual design in the field. The borrowing runs both ways, and it never changes which question a lane is asking. Product went out of the building to find demand. Design went to the boardroom and argued from behaviour.

The software PM was born doing design's job. In the late 1980s the expertise in how people behave already existed, at Bell Labs, PARC, IBM and in university HCI groups, but it sat in the lab, not on the team. The program manager held design's bar because the program manager was in the room.

Then the default became a principle. Horowitz made the product manager “the CEO of the product”, and Scrum gave the product owner the backlog and no designer to share it with. Who happened to be there became who was supposed to decide.
{% endtimeline %}

## Share the work, not the judgement

Design has its own name for the three questions. IDEO, the firm that took design thinking into business, teaches them as desirability, feasibility and viability, and Tim Brown's 2008 pitch to executives rests on the same three. Each has a natural owner. Desirability is a judgement about people, made from evidence of behaviour, and it's what experience design spent a century learning to make. Feasibility is a judgement about technology, and it belongs to engineering. Viability is a judgement about the market, made from evidence of demand, and it's product management's inheritance from Nielsen and the brand men.

Marty Cagan's model of the team gets most of this right. A product manager, a designer and a tech lead, together from discovery onwards, is the team the history argues for: every role in the room before the decision is made, not after it. Where the model blurs is “value”. Cagan gives the product manager the value risk, whether customers will buy it or choose to use it, alongside business viability. That one word holds two questions. Whether people want something and whether enough of them will pay for it need different evidence: the first comes from watching what people do, the second from what they commit to. Put both under one owner and one kind of evidence tends to win. Split value into desirability and viability, and the trio works as intended, with three bars and three people to hold them.

Engineering already works this way. Everyone on a modern team writes some code, or soon will, and nobody thinks that makes everyone the judge of what gets merged. The tech lead holds that bar. The same principle applies to the other two. Anyone can run an interview, sketch a flow or build a pricing model. Holding the bar means being the person whose judgement decides whether it's good enough.

For that to work, the bars need one rule. Within its own domain, a bar-holder's judgement isn't overruled by rank or title, only by better evidence of the same kind. A designer's call that people will struggle with a flow is overturned by people not struggling with it, not by a senior stakeholder who likes it. A product manager's call that a feature won't pay for itself is overturned by evidence of demand, not by a designer's conviction that users will love it. An engineer's estimate is overturned by a better estimate, not by a deadline.

Across domains the bars will conflict, and someone has to make the trade-off. That should be whoever owns the outcome, explicitly and on the record: “We're shipping this knowing people will struggle with X, because of Y.” Engineering has a name for that kind of decision, technical debt, and a habit of writing it down. Experience debt deserves the same ledger. The harm of one role dictating was never that its side won the trade-offs. Often it should. The harm is that the trade-offs were never named, so nobody knew what was owed.

Generative AI raises the stakes. Product managers generate interfaces, designers model markets, engineers draft research plans, and anyone can build a convincing prototype in an afternoon. The artefacts that used to mark out each role, the screen, the spreadsheet and the code, are no longer scarce. What stays scarce is the judgement about whether any of it is good. A generated interface looks as finished as a tested one. Generated code runs whether or not it will survive the next change. A plausible market model is easy to make and hard to check. In each case the artefact hides how much judgement went into it, or didn't.

So the work can be shared, and should be. More people making more things, faster, is good for every team. The judgement can't be shared the same way, because each kind takes years of evidence to learn and is easiest to fake when the artefact looks finished. Code generation no more automates an engineer's sense of what will break in production than screen generation automates a designer's sense of where people will get lost. Share the work, not the judgement.

The history carries a warning. In the late 1980s the expertise in how people behave existed, but it sat in the lab, and the bar went to whoever was in the room. Nobody decided that design's judgement belonged to the program manager. It ended up there, and within a decade it was written down as the job.

The same thing can happen now, to any of the three. “AI can do the screens”, or the research, takes design out of the room. “AI can write the code” takes engineering out. “AI can model the market” takes product out. Each sounds like efficiency, and each moves a bar to someone who doesn't hold it without anyone deciding that it should move. The work still gets done. What goes missing is the person who could tell whether it was right.

The bar has always gone to whoever was in the room. The question now is who's still in it.

## Selected sources

- [Ben Horowitz — Good Product Manager/Bad Product Manager](https://a16z.com/good-product-manager-bad-product-manager/)
- [Joel Spolsky — How to be a program manager](https://www.joelonsoftware.com/2009/03/09/how-to-be-a-program-manager/)
- [Computer History Museum — Apple Human Interface Guidelines (1987)](https://www.computerhistory.org/collections/catalog/102679991)
- [Tim Brown — Design Thinking, Harvard Business Review (2008)](https://hbr.org/2008/06/design-thinking)
- [IDEO — Design thinking: desirability, feasibility and viability](https://designthinking.ideo.com/)
- [SVPG — The four big risks](https://www.svpg.com/four-big-risks/)
- [Bring the Donuts — The McElroy memo turns ninety](https://www.bringthedonuts.com/essays/product-management-mcelroy-memo-turns-ninety/)
- [Quirk's — The birth of the focus group](https://www.quirks.com/articles/the-birth-of-the-focus-group)
- [Computer History Museum — Scott Cook](https://computerhistory.org/profile/scott-cook/)
- [Wikipedia — Time and motion study](https://en.wikipedia.org/wiki/Time_and_motion_study)
- [Wikipedia — John E. Karlin](https://en.wikipedia.org/wiki/John_E._Karlin)
- [Wikipedia — Scrum (software development)](https://en.wikipedia.org/wiki/Scrum_(software_development))
- [Manifesto for Agile Software Development](https://agilemanifesto.org/)
- [Wikipedia — Design thinking](https://en.wikipedia.org/wiki/Design_thinking)
- [Wikipedia — Participatory action research](https://en.wikipedia.org/wiki/Participatory_action_research)
- [Stanford HCI — Participatory design (Bringing Design to Software)](https://hci.stanford.edu/publications/bds/14-p-partic.html)
- [Design Council — History of the Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/history-of-the-double-diamond/)
- [Wikipedia — Toyota Production System](https://en.wikipedia.org/wiki/Toyota_Production_System)
- [NN/g — Discovery in Agile](https://www.nngroup.com/articles/discovery-in-agile/)
- [Don Norman — Design for a Better World](https://jnd.org/books/design-for-a-better-world/)
- [UX Magazine — The historical context of UX, UI and product design](https://uxmag.com/articles/the-historical-context-of-ux-ui-and-product-design)
- [CareerFoundry — The history of UX design](https://careerfoundry.com/en/blog/ux-design/the-fascinating-history-of-ux-design-a-definitive-timeline/)
- [UX Design Institute — History of UX](https://www.uxdesigninstitute.com/blog/history-of-ux/)
