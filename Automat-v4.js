"use strict";
/* WARNING: User Discretion is Advised!
 * An Idle Class Automat v4.0.1
 * During development constantly tested in Firefox on Linux with game version 0.8.2
 */
class IdleClassAutomat {
  // TODO setter
  outerLoopMillis = 4400; // check the game progress | every 4.4 seconds
  innerLoopMillis = 800; // handle most of the game for you | every 0.8 seconds
  cashSpendOnUpgrades = 0.9; // ration 0.67 = 67%
  bankruptcyResetFraction = 2.0; // ratio 0.67 = 67%

  // @see https://www.reddit.com/r/TheIdleClass/comments/ehd9u1/the_absolute_best_text_bonus_for_emails/
  bizzWords = ["ASAP", "B2B", "B2C", "BYOD", "CTR", "EBITDA", "EOD", "KPI", "ROI", "SEO", "SAAS", "accelerator", "action", "advertainment", "agile", "analytic", "bandwidth", "ballpark", "best practice", "blue sky thinking", "boot strap", "bootstrap", "brand", "bubble", "cash flow", "churn rate", "circle back", "client", "content marketing", "crowdfund", "crowdsource", "customer", "deep dive", "deliverable", "digital nomad", "disrupt", "downsiz", "drill down", "dynamism", "early adopter", "end-user", "end user", "enterprise", "equity", "evangelist", "evergreen", "executive", "exit strategy", "freemium", "gamification", "gamified", "globalization", "growth hack", "golden parachute", "hacking", "holistic", "hyperlocal", "ideat", "influencer", "innovat", "intellectual property", "invest", "iterat", "layoff", "leverage", "market", "millennial", "mission", "monetiz", "moving forward", "optimiz", "outsourc", "overhead", "paradigm", "pivot", "profit", "redundanc", "revenue", "sale", "scaleable", "share", "shareholder", "stakeholder", "startup", "stock", "synergy", "thought leader", "trim the fat", "unicorn", "valuation", "visionary", "wheelhouse", "wunderkind"];
  // TODO exchange with shakespeare ipsum ( api ( if possible ) )
  chatPhrases = ["... Are you seriously wasting my time like this?", ", I really don't want to hear about it.", ", do you feel ready to fire your friends?", ", you put our glorious company to shame.", "!! Guess what?? You are an ass!", ", have you considered getting back to work?", ": I love hearing from you, almost as much as I hate it.", " is such a freakin tool, I mean really, they... oh ww lol!", " -- this better be good news.", ": ¯\_(ツ)_/¯", ", hold on, I'm playing this idle game called The Idle Class", ", hold on, my Trimps are just about to hit my target zone...", "!! Guess what?? Hevipelle eats ass!"];

  #outerLoopId = 0;
  #innerLoopId = 0;
  #outgoingMailDelay = false;
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
  #deps = {
    inv: 0,
    rd: 1,
    acq: 2,
    // 3, i guess, it's training ..
    hr: 4
  };
  bizSelfNaming() {
    if( "Unnamed Business" !== game.businessName().name() ) return;
    game.businessName().newName("no fancy biz-name #" + ( game.pastBusinesses().length + 1 ) );
    game.businessName().save()
  }
  unlockCartel() {
    if( 1 === game.communityLocked.val() ) return
    game.cartel.unlock()
  }
  random( array ) { return array[Math.floor(Math.random() * array.length)] }
  earnDollars() {
    game.addManualClicks();
    $(".top-click-value-display").text(game.earnedPerClick.displayVal()).fadeToggle()
  }
  buyUpgrades() {
    // inverse the loop | for better gear ^^
    for(let i = game.availableUpgrades().length - 1; i >= 0; i--) {
      let upgr = game.availableUpgrades()[i];
      if( upgr.cantAfford() ) continue
      if( upgr.price.val() < ( game.currentCash.val() * this.cashSpendOnUpgrades ) ) upgr.buy()
    }
  }
  buyStaff() {
    // reverse the loop | in favour of more "productive" units
    for( let i = 11; i >= 0; i-- ) {
      let employee = game.units.peek()[i];
      if( false === employee.available() ) continue // No cheating, Sir (:
      // always buy the first unit of everything
      let firstUnit = 1 > employee.num.val() && ( game.currentCash.val() >= employee.price.val());
      // let the "rest" be biased on current share of total income
      let fairShare = ( parseFloat(employee.shareOfTotal()) / 100 * game.currentCash.val() ) > employee.price.val();
      if( fairShare || firstUnit ) employee.buy()
    }
  }
  replyMail() {
    this.outgoingMail(); // TODO why is this somewhat coupled
    for( let i = game.mail().length - 1; i >= 0; i-- ) {
      let email = game.mail()[i];
      if( true === email.replied() ) continue // possible cheat: uncomment that line to exploit emails
      //email.inputText(email.from); // this really is a one-time achievement
      email.inputText(""); // quickfix
      while( email.inputText().length < 180 ) email.inputText( email.inputText() + " " + this.random( this.bizzWords ) )
      // going biz-words only, means more cash .. i guess
      email.respond()
    }
  }
  outgoingMail() {
    if( true === game.locked().outgoingMail || true === game.composedMail().resting() ) return
    // TODO hiliriouse .. building a five sec delay for a split sec task ..
    if( true === this.#outgoingMailDelay ) return
    this.#outgoingMailDelay = true;
    let outgoing = game.composedMail();
    if(outgoing.stressLevel.val() > 50) {
      outgoing.selectedDepartment( this.deps.hr )
    } else {
      /* it really does not matter
       * spamming an inactive department, will provoke a mailer-deamon in your inbox
       * ( and guess what: you can reply to that .. and generate money )
       */
      outgoing.selectedDepartment( this.random( [ this.deps.inv, this.deps.rd, this.deps.acq ] ) );
      outgoing.selectedUrgency( this.random( [0, 1, 2] ) )
    }
    outgoing.to("John Wayne");
    outgoing.subject("jist doit");
    while( outgoing.message().length < 180 ) outgoing.message(outgoing.message() + " " + this.random( this.bizzWords ))
    setTimeout(game.composedMail().send, 2000);
    setTimeout(this.stopOutgoingDelay, 5000)
  }
  stopOutgoingDelay() { this.#outgoingMailDelay = false }
  // simon sayz: only switch off the machine, IF there are @ least 10 emps to "deploy" (:
  #more = {
    _offset: 10,
    intern() { return this._offset + game.research().intern() <= game.units.peek()[0].num.val() },
    slave() { return this._offset + game.research().wage() <= game.units.peek()[1].num.val() },
    hotshot() { return this._offset + game.research().sales() <= game.units.peek()[2].num.val() },
    middle() { return this._offset + game.research().manager() <= game.units.peek()[3].num.val() }
  };
  /* just assign fckn all
   * we will need the storage | for motivational emails #wink
   * there are good reasons to turn away from your business from time to time
   * ( that's when you need auto-sell )
   */
  doScience() {
    if( game.research().patents().length > 0 ) game.research().sellPatents();
    if( this.#more.intern() || this.#more.slave() || this.#more.hotshot() || this.#more.middle() ) {
      if( game.research().active() ) game.research().toggleProduction(); // off
      game.research().assignMax();
      game.research().toggleProduction(); // back on
    }
  }
  // investment helper
  #targetTime = {
    1: [1,12],
    2: [1,12,70],
    3: [1,12,70,720],
    4: [1,12,70,720,1440]
  };
  invest() {
    if( game.activeInvestments().length === game.simultaneousInvestments.val() ) return
    let i = game.simultaneousInvestments.val();
    if( i > 4 ) i = 4;
    /* cheat-hint:
     * you can "overload" the percentage of your investments
     * but i've witnessed no real value in doing so, during early games
     * ( and you maybe won't overload that much, in the later games )
     */
    game.makeInvestment( 11, this.random( this.#targetTime[i] ) )
  }
  divest() {
    if( 0 === game.pendingInvestmentCount.val() ) return
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
  #fireId = 0;
  microManage() {
    if( 0 === game.activeAcquisitions().length ) return
    let acquisition = game.activeAcquisitions()[0]; // in the current game version there is always only 1 acquisition
    if( 1 === game.pendingAcquisitionCount.val() ) {
      clearInterval(this.#fireId)
      this.#fireId = 0;
      acquisition.sell();
      return
    }

    // use some kinda sub-interval to massively accelerate biz termination
    if( 0 === this.#fireId ) this.#fireId = setInterval(function(){$('button[data-bind^="click: fire"]').click()}, 100)
    let fudgeGuys = acquisition.workers()[2]; // this and this only will massively boost the net-value
    let stillHiring = acquisition.initialPrice.val() > acquisition.cashSpent.val(); // the new way
    let isAffordable = acquisition.netValue.val() > fudgeGuys.price.val();
    if( stillHiring && isAffordable ) fudgeGuys.hire()

    for(let j = acquisition.chats().length - 1; j >= 0; j--) {
      let acqChat = acquisition.chats()[j];
      if(acqChat.finished() === true) {
        acqChat.close()
      } else if(acqChat.messages().length > 0 && acqChat.messages()[acqChat.messages().length - 1].source !== "You") {
        acqChat.select();
        // The cleanest way to handle these is by using the document elements
        document.getElementById('chat-response').value = acqChat.name + this.random( this.chatPhrases );
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
        acqMail.inputText(acqMail.inputText() + " " + this.random( this.bizzWords ))
      }
      acqMail.respond()
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
