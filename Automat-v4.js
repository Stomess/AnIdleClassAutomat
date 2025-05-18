"use strict";
/* An Idle Class Automat v3.5.12
 * Base structure shamelessly lended from argembarger (:
 * During development constantly tested in Firefox on Linux with game version 0.8.2
 * If it crashes your game, browser, machine, life.. start over ( or write your own stuff )
 */
class IdleClassAutomat {
  // TODO setter
  outerLoopMillis = 3300; // check the game progress | every 3.3 seconds
  innerLoopMillis = 2200; // handle most of the game for you | every 2.2 seconds
  cashSpendOnUpgrades = 1.0; // ration 0.67 = 67%
  acquisitionStopHiringFraction = 0.666; // Default 0.666, stops hiring acq employees at less than 66.6% workers remaining, RATIO VALUE, 0.67 = 67%
  bankruptcyResetFraction = 2.0; // ratio 0.67 = 67%

  // @see https://www.reddit.com/r/TheIdleClass/comments/ehd9u1/the_absolute_best_text_bonus_for_emails/
  bizzWords = ["ASAP", "B2B", "B2C", "BYOD", "CTR", "EBITDA", "EOD", "KPI", "ROI", "SEO", "SAAS", "accelerator", "action", "advertainment", "agile", "analytic", "bandwidth", "ballpark", "best practice", "blue sky thinking", "boot strap", "bootstrap", "brand", "bubble", "cash flow", "churn rate", "circle back", "client", "content marketing", "crowdfund", "crowdsource", "customer", "deep dive", "deliverable", "digital nomad", "disrupt", "downsiz", "drill down", "dynamism", "early adopter", "end-user", "end user", "enterprise", "equity", "evangelist", "evergreen", "executive", "exit strategy", "freemium", "gamification", "gamified", "globalization", "growth hack", "golden parachute", "hacking", "holistic", "hyperlocal", "ideat", "influencer", "innovat", "intellectual property", "invest", "iterat", "layoff", "leverage", "market", "millennial", "mission", "monetiz", "moving forward", "optimiz", "outsourc", "overhead", "paradigm", "pivot", "profit", "redundanc", "revenue", "sale", "scaleable", "share", "shareholder", "stakeholder", "startup", "stock", "synergy", "thought leader", "trim the fat", "unicorn", "valuation", "visionary", "wheelhouse", "wunderkind"];
  // TODO exchange with shakespeare ipsum ( api ( if possible ) )
  chatPhrases = ["... Are you seriously wasting my time like this?", ", I really don't want to hear about it.", ", do you feel ready to fire your friends?", ", you put our glorious company to shame.", "!! Guess what?? You are an ass!", ", have you considered getting back to work?", ": I love hearing from you, almost as much as I hate it.", " is such a freakin tool, I mean really, they... oh ww lol!", " -- this better be good news.", ": ¯\_(ツ)_/¯", ", hold on, I'm playing this idle game called The Idle Class", ", hold on, my Trimps are just about to hit my target zone...", "!! Guess what?? Hevipelle eats ass!"];

  #outerLoopId = 0;
  #innerLoopId = 0;
  #outgoingMailDelay = 0;
  #gameState = {
    _current: -2,
    freshStart: 0,
    waitMail: 1,
    waitInvest: 2,
    waitScience: 3,
    waitBankrupt: 4,
    waitAcq: 5,
    waitInfinit: 6,
    get current() { return this._current },
    setNext() { ++this._current },
    setBack() { this._current = this.freshStart }
  };
  bizSelfNaming() {
    if( "Unnamed Business" !== game.businessName().name() ) return;
    game.businessName().newName("no fancy biz-name #" + ( game.pastBusinesses().length + 1 ) );
    game.businessName().save()
  }
  unlockCartel() {
    if( 1 === game.communityLocked.val() ) return;
    game.cartel.unlock()
  }
  randomBizWord() {
    return this.bizzWords[Math.floor(Math.random() * this.bizzWords.length)]
  }
  randomDialogue() {
    return this.chatPhrases[Math.floor(Math.random()*this.chatPhrases.length)]
  }
  earnDollars() {
    game.addManualClicks();
    $(".top-click-value-display").text(game.earnedPerClick.displayVal()).fadeToggle()
  }
  buyUpgrades() {
    if(this.cashSpendOnUpgrades >= 1.0) {
      game.buyAllUpgrades()
    } else {
      for(let i = 0; i < game.availableUpgrades().length; i++) {
        let upgr = game.availableUpgrades()[i];
        if(upgr.price.val() < (game.currentCash.val() * this.cashSpendOnUpgrades)) {
          upgr.buy()
        }
      }
    }
  }
  buyStaff() {
    // reverse the loop | in favour of more "productive" units
    for(let i = 11; i >= 0; i--) {
      let employee = game.units.peek()[i];
      // No cheating, Sir (:
      if(!employee.available()) continue
      // Based on current share of total income
      let fairShare = parseFloat(employee.shareOfTotal()) / 100;
      // ( if possible ) always buy til first 5 | to activate next higher unit
      if(employee.num.val() <= 4 && (employee.price.val() <= game.currentCash.val())) {
        employee.buy()
      } else if(employee.price.val() < (game.currentCash.val() * fairShare)) {
        employee.buy()
      }
    }
  }
  replyMail() {
    this.outgoingMail();
    // Automatically replies to emails with "<sender_name>: <string_of_biz_babble>"
    for(let i = game.mail().length - 1; i >= 0; i--) {
      let email = game.mail()[i];
      // EMAIL CHEAT: You can uncomment the following line to exploit emails
      if(email.replied() === true) continue
      email.inputText(email.from + ",");
      while(email.inputText().length < 180) {
        email.inputText(email.inputText() + " " + this.randomBizWord())
      }
      // Uncomment to catch what these actually are in console, for funsies :)
      //console.log("" + email.inputText());
      email.respond()
    }
  }
  outgoingMail() {
    // Send random emails to departments unless stress is above 50% (then spam to HR)
    if(game.locked().outgoingMail === false && game.composedMail().resting() === false && this.#outgoingMailDelay === 0) {
      this.#outgoingMailDelay = 1;
      let outgoing = game.composedMail();
      if(outgoing.stressLevel.val() > 50) {
        // Human Resources
        outgoing.selectedDepartment('4')
      } else {
        // Random other. 0 = investments, 1 = r&d, 2 = acquisitions
        let r = Math.random();
        // No acquisitions; constrain to [0...0.666], or 1 or 0
        if(game.activeInvestments().length === 0) r = r * 0.666
        // No investments; additionally constrain to [0...0.333], or just 1
        if(game.activeInvestments().length === 0) r = r * 0.5
        outgoing.selectedDepartment((r <= 0.333) ? '1' : ((r <= 0.666) ? '0' : '2'));
        r = Math.random();
        outgoing.selectedUrgency((r <= 0.333) ? '1' : ((r <= 0.666) ? '0' : '2'))
      }
      outgoing.to("John Wayne");
      outgoing.subject(this.randomDialogue());
      while(outgoing.message().length < 180) {
        outgoing.message(outgoing.message() + " " + this.randomBizWord())
      }
      setTimeout(this.sendMail, 2000);
      setTimeout(this.stopWaitingForMail, 5000)
    }
  }
  sendMail() {
    game.composedMail().send()
  }
  stopWaitingForMail() {
    _ica.#outgoingMailDelay = 0
  }
  // little r&d-helper | to improve readability of if-statement
  more(dict, offset = 10) {
    let name = Object.keys(dict)[0];
    let value = dict[name];

    return game.research()[name]() + offset <= game.units.peek()[value].num.val()
  }
  /* just assign fckn all
   * we will need the storage | for motivational emails #wink
   * there are good reasons to turn away from your business from time to time
   * ( that's when you need sell )
   */
  doScience() {
    if( game.research().patents().length > 0 ) game.research().sellPatents();
    // just preparing some real js-magic here
    let intern = 0, wage = 1, sales = 2, manager = 3; // TODO see if we can do nicer than this
    // simon sayz: only switch the machine off, if there are @ least 10 emps to "deploy" (:
    if( this.more({intern}) || this.more({wage}) || this.more({sales}) || this.more({manager}) ) {
      if( game.research().active() ) game.research().toggleProduction(); // off
      game.research().assignMax();
      game.research().toggleProduction(); // back on
    }
  }
  // TODO let's try another approach ( laytor ( maybeee ) )
  invest() {
    if(game.activeInvestments().length < game.simultaneousInvestments.val()) {
      let invBought = false;
      let invChecks = 0;
      // Check existing investment target times, fill shortest-found slot
      // Remember that target time is in milliseconds; 1 min = 60000 ms
      // Desired target times by default are 1, 12, 70, 1:59, 2:59, etc...
      // Desired percentages by default are based on number of slots
      // 1 slot = 50%, 2 = 40%, 3 = 30%, 4 = 20%, 5+ = 10%
      while(invBought === false) {
        let invTargetMins = 1;
        let invTargetMs = 60000;
        let invFoundTarget = false;
        if(invChecks === 1) {
          invTargetMins = 12;
          invTargetMs *= invTargetMins
        }
        else if(invChecks === 2) {
          invTargetMins = 70;
          invTargetMs *= invTargetMins
        }
        else if(invChecks > 2) {
          invTargetMins = 59 + (60 * (invChecks - 2));
          invTargetMs *= invTargetMins
        }
        for(let i = 0; i < game.activeInvestments().length; i++) {
          if(game.activeInvestments()[i].targetTime === invTargetMs) {
            invFoundTarget = true
          }
        }
        if(invFoundTarget === true) {
          invChecks++
        } else {
          invBought = true;
          game.makeInvestment(Math.max(60 - (game.simultaneousInvestments.val() * 10), 10), invTargetMins)
        }
      }
    }
  }
  divest() {
    if(game.pendingInvestmentCount.val() > 0) {
      for(let i = game.activeInvestments().length - 1; i >= 0; i--) {
        // sell
        if(game.activeInvestments()[i].timeRemaining() === 0) {
          // acquire
          if(game.locked().acquisitions === false && game.simultaneousInvestments.val() > 1 && game.activeAcquisitions().length < game.simultaneousAcquisitions.val()) {
            // Only acquire investments if some better investment is not closer to completion than
            // half of the finished investment's original target time.
            let invSorted = game.activeInvestments().slice();
            let invAcquired = false;
            invSorted.sort(function(a, b){ return b.targetTime - a.targetTime });
            for(let j = 0; j < invSorted.length; j++) {
              if(invSorted[j].targetTime === game.activeInvestments()[i].targetTime) {
                invAcquired = true;
                break
              } else if(invSorted[j].timeRemaining() < game.activeInvestments()[i].targetTime * 0.5) {
                break
              }
            }
            if(invAcquired === false) {
              game.activeInvestments()[i].handlePayout()
            } else {
              game.activeInvestments()[i].handleAcquisition()
            }
          } else if(game.pendingAcquisitionCount.val() === 0) {
            // ONLY pay out if there ISN'T a currently-pending acquisition.
            // If an acquisition is actively paying out, do nothing, simply wait.
            game.activeInvestments()[i].handlePayout()
          }
        }
      }
    }
  }
  // little bankruptcy-checker, to improve readability of if-statements
  helper = {
    firstBiz: function() { return 0 === game.bankruptcies.val() },
    secondBiz: function() { return 1 === game.bankruptcies.val() },
    anyOtherBiz: function() { return 2 <= game.bankruptcies.val() },
    bonusLess: function( ref ) { return ref > game.nextBankruptcyBonus.val() },
    bonusLessConfig: function( setup ) { return this.bonusLess( setup * game.stats[38].val() ) }
  }
  /* i strongly suggest to always check out from the first game as soon as possible
   * as this unlocks goals ( wich further increases the multiplier )
   */
  bankruptcy() {
    if( this.helper.firstBiz() && this.helper.bonusLess(1.0) ) return // secure an achievement
    if( this.helper.secondBiz() && this.helper.bonusLess(8.0) ) return // secure another achievement
    // TODO swap that piece of equipment with setting and checking goals !!
    if( this.helper.anyOtherBiz() && this.helper.bonusLessConfig(this.bankruptcyResetFraction) ) return

    this.clearBothIntervals();
    this.#gameState.setBack();
    game.restartGame();
    this.lazilyKickOffOuterLoop()
  }
  // TODO rework that as well
  microManage() {
    if( 0 === game.activeAcquisitions().length ) return
    let acquisition = game.activeAcquisitions()[0]; // in the current game version there is always only 1 acquisition
    acquisition.fire(); // firing people acquires net value
    // Acquisition Assign
    if(acquisition.currentEmployees.val() > acquisition.initialEmployees * this.acquisitionStopHiringFraction) {
      for(let j = 0; j < acquisition.workers().length; j++) {
        let acqWorker = acquisition.workers()[j];
        // TODO in the current game version, you buy acquisition-workers from the above mentioned net value !!
        if(acqWorker.price.val() < game.currentCash.val()) acqWorker.hire()
      }
    }
    // Acquisition Chat
    for(let j = acquisition.chats().length - 1; j >= 0; j--) {
      let acqChat = acquisition.chats()[j];
      if(acqChat.finished() === true) {
        acqChat.close()
      } else if(acqChat.messages().length > 0 && acqChat.messages()[acqChat.messages().length - 1].source !== "You") {
        acqChat.select();
        // The cleanest way to handle these is by using the document elements
        document.getElementById('chat-response').value = acqChat.name + this.randomDialogue();
        document.getElementsByClassName("chat-submit")[0].click()
        // TODO ( example ) $("#chat-response") etc.
      }
    }
    // Acquisition Policy
    for(let j = acquisition.mail().length - 1; j >= 0; j--) {
      let acqMail = acquisition.mail()[j];
      if(acqMail.replied() === true) continue
      acqMail.inputText(acqMail.from + ",");
      while(acqMail.inputText().length < 180) {
        acqMail.inputText(acqMail.inputText() + " " + this.randomBizWord())
      }
      acqMail.respond()
    }
    // Acquisition Sell
    if(acquisition.sold() === false && acquisition.currentEmployees.val() === 0) {
      acquisition.sell()
    }
  }
  untilEmails() {
    this.earnDollars();
    this.buyUpgrades();
    this.buyStaff()
  }
  untilInvestments() {
    this.earnDollars();
    this.buyUpgrades();
    this.buyStaff();
    this.replyMail()
  }
  untilResearchAndDevelopment() {
    this.earnDollars();
    this.buyUpgrades();
    this.buyStaff();
    this.replyMail();
    this.invest();
    this.divest()
  }
  untilBankruptcy() {
    this.earnDollars();
    this.buyUpgrades();
    this.buyStaff();
    this.replyMail();
    this.invest();
    this.divest();
    this.doScience()
  }
  untilAcquisitions() {
    this.earnDollars();
    this.buyUpgrades();
    this.buyStaff();
    this.replyMail();
    this.invest();
    this.divest();
    this.doScience();
    this.bankruptcy()
  }
  untilInfinity() {
    this.earnDollars();
    this.buyUpgrades();
    this.buyStaff();
    this.replyMail();
    this.invest();
    this.divest();
    this.doScience();
    this.bankruptcy();
    this.microManage()
  }
  manageStateOfInnerLoop() {
    switch(this.#gameState.current) {
      case this.#gameState.freshStart:
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.bizSelfNaming();
        this.unlockCartel();
        this.#innerLoopId = setInterval(this.untilEmails.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitMail:
        if(game.locked().mail === true) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilInvestments.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitInvest:
        if(game.locked().investments === true) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilResearchAndDevelopment.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitScience:
        if(game.locked().research === true) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilBankruptcy.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitBankrupt:
        if(game.locked().bankruptcy === true) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilAcquisitions.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitAcq:
        if(game.locked().acquisitions === true) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilInfinity.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitInfinit:
        /* just fckn run forevor
         * until the somewhat parallel condition-check sayz something else
         * or we define some nu shit to handle ( like elections )
         */
        break
      default:
        clearInterval(this.#innerLoopId); // grandpa sayz: better be safe than sorry
        this.#gameState.setBack();
        console.warn('.. the default switch-case | aka the inner rabit-hole ..')
    }
  }
  lazilyKickOffOuterLoop() {
    clearInterval(this.#outerLoopId);
    this.#outerLoopId = setInterval(this.manageStateOfInnerLoop.bind(this), this.outerLoopMillis)
  }
  clearBothIntervals() {
    clearInterval(this.#outerLoopId);
    clearInterval(this.#innerLoopId)
  }
  constructor() {
    this.lazilyKickOffOuterLoop();
    // IF sht goes sideways, you can't even read the error messages, as they might fly-in 10 times a second on the browser console
    window.onerror = this.clearBothIntervals.bind(this)
  }
}; let _ica = new IdleClassAutomat()
