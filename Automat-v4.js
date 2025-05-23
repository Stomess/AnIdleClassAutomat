"use strict";
/* WARNING: User Discretion is Advised!
 * An Idle Class Automat v4.1.2
 * During development constantly tested in Firefox on Linux with game version 0.8.2
 */
class IdleClassAutomat {
  // TODO setter
  outerLoopMillis = 4400; // check the game progress | every 4.4 seconds
  innerLoopMillis = 800; // handle most of the game for you | every 0.8 seconds
  cashSpendOnUpgrades = 0.9; // ration 0.67 = 67%
  bankruptcyResetFraction = 2.0; // ratio 0.67 = 67%

  #maxReceiver = "B2B B2C CTR EOD KPI ROI SEO";
  //#overloadR = "B2B B2C CTR EOD KPI ROI SEO end-user end user freemium";
  #maxSubject = "ASAP BYOD SAAS sale agile brand ideat pivot share stock";
  //#overloadS = "ASAP BYOD SAAS sale agile brand ideat pivot share stock gamified holistic leverage outsourc overhead paradigm";
  #maxBody = "EBITDA action bubble client equity invest iterat layoff market profit disrupt downsiz hacking innovat mission monetiz optimiz revenue startup synergy unicorn analytic ballpark customer dynamism";
  //#overloadB = "EBITDA action bubble client equity invest iterat layoff market profit disrupt downsiz hacking innovat mission monetiz optimiz revenue startup synergy unicorn analytic ballpark customer dynamism bandwidth bootstrap cash flow crowdfund deep dive evergreen executive redundanc scaleable valuation visionary boot strap churn rate drill down enterprise evangelist hyperlocal influencer";

  // @see https://www.reddit.com/r/TheIdleClass/comments/ehd9u1/the_absolute_best_text_bonus_for_emails/
  #muchMoreBizzWords = "millennial wheelhouse wunderkind accelerator circle back crowdsource deliverable growth hack shareholder stakeholder gamification trim the fat advertainment best practice digital nomad early adopter exit strategy globalization moving forward thought leader golden parachute blue sky thinking content marketing intellectual property"; // sorted by length, for further process optimization (;
  // TODO exchange with shakespeare ipsum ( api ( if possible ) )
  chatPhrases = ["... Are you seriously wasting my time like this?", ", I really don't want to hear about it.", ", do you feel ready to fire your friends?", ", you put our glorious company to shame.", "!! Guess what?? You are an ass!", ", have you considered getting back to work?", ": I love hearing from you, almost as much as I hate it.", " is such a freakin tool, I mean really, they... oh ww lol!", " -- this better be good news.", ": ¯\_(ツ)_/¯", ", hold on, I'm playing this idle game called The Idle Class", ", hold on, my Trimps are just about to hit my target zone...", "!! Guess what?? Hevipelle eats ass!"];

  #outerLoopId = 0;
  #innerLoopId = 0;
  #hrBugDelay = false;
  #gameState = {
    freshStart: 0,
    waitMail: 1,
    waitInvest: 2,
    waitScience: 3,
    waitBankrupt: 4,
    waitAcq: 5,
    waitOutG: 6,
    waitInfinit: 7,
    get current() { return this._current },
    setNext() { ++this._current },
    init() { this._current = this.freshStart }
  };
  #deps = {
    inv: 0,
    rd: 1,
    acq: 2,
    train: 3,
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
  // centralized solution | for inbox & acquisition
  simpleMail( which ) {
    if( 0 === which.length || true === which[0].replied() ) return
    // slow it down a nodge | just one reply per action-loop ^^
    which[0].inputText(which[0].from + " " + this.#maxBody).respond()
    // cheat hint: you can respond to a full inbox, but from time to time it raises serious game errors (;
    /*for( let i = which.length - 1; i >= 0; i-- ) {
      let _mail = which[i];
      if( true === _mail.replied() ) continue // possible cheat: uncomment that line to exploit
      // using the name really doubles the benefit my friend
      _mail.inputText(_mail.from + " " + this.#maxBody).respond()
    }*/
  }
  replyMail() { this.simpleMail( game.mail() ) }
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
    if( 0 === game.pendingInvestmentCount.val() ) return // nothing to divest
    if( true === game.locked().acquisitions ) return game.cashOutAllInvestments() // no fancy dancy
    if( 1 === game.activeAcquisitions().length ) return // nothing to acquire
    // do a search, for the 1 thing that could be acquired
    for(let i = game.activeInvestments().length - 1; i >= 0; i--) {
      let activeInv = game.activeInvestments()[i];
      if( 0 === activeInv.timeRemaining() ) {
        activeInv.handleAcquisition();
        break
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

    this.clearAllIntervals();
    game.restartGame();
    this.lazilyKickOffOuterLoop()
  }
  #acqHelper = {
    empPer() { return game.activeAcquisitions()[0].currentEmployees.val() / game.activeAcquisitions()[0].initialEmployees },
    workAround() {
      // $('button[data-bind^="click: fire"]').click() // does not work, when leave the tab #sad-face
      game.activeAcquisitions()[0].fire();
      if( this.checkVal > this.empPer() ) {
        let _t = ( Date.now() - this.lastStamp ) / 1000 / 60;
        console.warn(`your acquisition just hit ${this.checkVal.toFixed(1)} after approximately ${_t.toFixed(1)} minutes`);
        this.checkVal -= 0.1;
        this.lastStamp = Date.now()
      }
    },
    kickOff() {
      this.checkVal = this.empPer();
      this.intervalId = setInterval(this.workAround.bind(this), 80);
      this.lastStamp = Date.now()
    },
    setBack() {
      clearInterval( this.intervalId );
      this.intervalId = undefined
    }
  };
  microManage() {
    if( 0 === game.activeAcquisitions().length ) return
    let acquisition = game.activeAcquisitions()[0]; // in the current game version there is always only 1 acquisition
    if( 1 === game.pendingAcquisitionCount.val() ) {
      this.#acqHelper.setBack();
      acquisition.sell();
      return
    }
    // use some kinda sub-interval to massively accelerate biz termination
    if( undefined === this.#acqHelper.intervalId ) this.#acqHelper.kickOff()
    let fudgeGuys = acquisition.workers()[2]; // this and this only will massively boost the net-value of any acquisition
    let stillHiring = acquisition.initialPrice.val() > ( acquisition.cashSpent.val() + fudgeGuys.price.val() );
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
    this.simpleMail( acquisition.mail() ) // policies
  }
  simplyWaitForIt() {
    game.composedMail().send();
    this.#hrBugDelay = false
  }
  instantStressRelief( currentLvL) { game.composedMail().lowerStress(1, currentLvL, 1) }
  hrWorkaround() {
    if( true === this.#hrBugDelay ) return
    this.#hrBugDelay = true;
    game.composedMail().selectedDepartment( this.#deps.hr ).to( this.#maxReceiver ).subject( this.#maxSubject ).message( this.#maxBody );
    setTimeout(this.simplyWaitForIt.bind(this), 2200)
  }
  outgoingMail() {
    // cheating point ( 1 ) | resting seems to be a small 3sec time-frame, in which the "normal" mail-interface cannot be used
    if( true === game.composedMail().resting() ) return // comment out to "overload"
    // cheating point ( 2 ) | above 100 the send-button will be unavailable to "regular" players
    if( 100 < game.composedMail().stressLevel.val() ) {
      return this.hrWorkaround() // comment out to "overload"
      //this.instantStressRelief( game.composedMail().stressLevel.val() ) // cheat point ( 3 )
    }
    /* spamming an inactive department, will provoke a mailer-deamon in your inbox
     * ( and guess what: you can reply to that .. and generate money )
     */
    let _d = this.random( [ this.#deps.inv, this.#deps.rd, this.#deps.acq, this.#deps.train ] );
    let _u = this.random( [0, 1, 2] );
    let _r = this.#maxReceiver; let _s = this.#maxSubject; let _m = this.#maxBody;
    game.composedMail().selectedDepartment( _d ).selectedUrgency( _u ).to( _r ).subject( _s ).message( _m ).send()
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
  untilOutgoingMail() {
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
  untilInfinity() {
    this.earnDollars();
    this.buyUpgrades();
    this.buyStaff();
    this.replyMail();
    this.invest();
    this.divest();
    this.doScience();
    this.bankruptcy();
    this.microManage();
    this.outgoingMail()
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
        this.#innerLoopId = setInterval(this.untilOutgoingMail.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitOutG:
        if(game.locked().outgoingMail === true) break
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
        console.warn(`.. you just entered the inner rabit-hole | aka default switch-case .. with game-state ${this.#gameState.current}`);
        this.#gameState.init()
    }
  }
  lazilyKickOffOuterLoop() {
    clearInterval(this.#outerLoopId);
    this.#gameState.init();
    this.#outerLoopId = setInterval(this.manageStateOfInnerLoop.bind(this), this.outerLoopMillis)
  }
  clearAllIntervals() {
    clearInterval(this.#outerLoopId);
    clearInterval(this.#innerLoopId);
    this.#acqHelper.setBack()
  }
  constructor() {
    this.lazilyKickOffOuterLoop();
    // IF sht goes sideways, you can't even read the error messages, as they might fly-in 10 times a second on the browser console
    window.onerror = this.clearAllIntervals.bind(this)
  }
}; let _ica = new IdleClassAutomat()
