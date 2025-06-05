/* WARNING: User Discretion is Advised!
 * An Idle Class Automat v4.3.8
 * During development constantly tested in Firefox on Linux with game version 0.8.2
 */
class IdleClassAutomat {
  // TODO setter
  outerLoopMillis = 4400; // check the game progress | every 4.4 seconds
  innerLoopMillis = 800; // handle most of the game for you | every 0.8 seconds
  cashSpendOnUpgrades = 0.666; // ration 0.67 = 67%
  bankruptcyResetFraction = 2.0; // ratio 0.67 = 67%
  currentMailBugTimeout = 3300;

  #maxReceiver = "B2B B2C CTR EOD KPI ROI SEO";
  //#overloadR = "B2B B2C CTR EOD KPI ROI SEO end-user end user freemium";
  #maxSubject = "ASAP BYOD SAAS sale agile brand ideat pivot share stock";
  //#overloadS = "ASAP BYOD SAAS sale agile brand ideat pivot share stock gamified holistic leverage outsourc overhead paradigm";
  #maxBody = "EBITDA action bubble client equity invest iterat layoff market profit disrupt downsiz hacking innovat mission monetiz optimiz revenue startup synergy unicorn analytic ballpark customer dynamism";
  //#overloadB = "EBITDA action bubble client equity invest iterat layoff market profit disrupt downsiz hacking innovat mission monetiz optimiz revenue startup synergy unicorn analytic ballpark customer dynamism bandwidth bootstrap cash flow crowdfund deep dive evergreen executive redundanc scaleable valuation visionary boot strap churn rate drill down enterprise evangelist hyperlocal influencer";

  // @see https://www.reddit.com/r/TheIdleClass/comments/ehd9u1/the_absolute_best_text_bonus_for_emails/
  #muchMoreBizzWords = "millennial wheelhouse wunderkind accelerator circle back crowdsource deliverable growth hack shareholder stakeholder gamification trim the fat advertainment best practice digital nomad early adopter exit strategy globalization moving forward thought leader golden parachute blue sky thinking content marketing intellectual property"; // sorted by length, for further process optimization (;
  // TODO exchange with shakespeare ipsum ( api ( if possible ) )
  chatPhrases = ["... Are you seriously wasting my time like this?", "I really don't want to hear about it.", "do you feel ready to fire your friends?", "you put our glorious company to shame.", "!! Guess what?? You are an ass!", "have you considered getting back to work?", ": I love hearing from you, almost as much as I hate it.", " is such a freakin tool, I mean really, they... oh ww lol!", " -- this better be good news.", ": ¯\_(ツ)_/¯", "hold on, I'm playing this idle game called The Idle Class", "hold on, my Trimps are just about to hit my target zone...", "!! Guess what?? Hevipelle eats ass!"];

  #outerLoopId = 0;
  #innerLoopId = 0;
  #gameState = {
    freshStart: 0,
    waitMail: 1,
    waitInvest: 2,
    waitScience: 3,
    waitBankrupt: 4,
    waitAcq: 5,
    waitOutG: 6,
    waitWindfallG: 7,
    waitInfinit: 8,
    gameLock: [
      function() { return game.locked().mail },
      function() { return game.locked().investments },
      function() { return game.locked().research },
      function() { return game.locked().bankruptcy },
      function() { return game.locked().acquisitions },
      function() { return game.locked().outgoingMail },
      function() { return game.locked().windfallGuarantee }
    ],
    get current() { return this._current },
    setNext() { ++this._current },
    setBack() { this._current = this.freshStart },
    init() {
      this.setBack();
      for( let a = 0; a < this.gameLock.length; a++ ) if( this.gameLock[a]() ) break; else this.setNext()
    }
  };
  #deps = {
    inv: "0",
    rd: "1",
    acq: "2",
    train: "3",
    hr: "4"
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
      if( !employee.available() || employee.workStopped() ) continue // No cheating, Sir (:
      if( employee.cantAfford() ) continue
      // always buy the first unit of everything || ATTENTION: price.val() is always dependent on the chosen rate (;
      let firstUnit = 1 > employee.num.val() && ( game.currentCash.val() >= employee.price.val());
      // let the "rest" be biased on current share of total income
      let fairShare = ( parseFloat(employee.shareOfTotal()) / 100 * game.currentCash.val() ) > employee.price.val();
      if( fairShare || firstUnit ) employee.buy()
    }
  }
  replyMail() {
    if( 0 === game.mail().length || game.goals().currentNoMail() || game.obstacles().crashed() ) return
    let _justOne = game.mail()[0];
    if( true === _justOne.replied() ) return // comment out | for possible exploit (;
    _justOne.inputText( _justOne.from + " " + this.#maxBody ).respond()
  }
  // simon sayz: only switch off the machine, IF there are @ least 10 emps to "deploy" (:
  #more = {
    _offset: 10,
    intern() { return this._offset + game.research().intern() <= game.units.peek()[0].num.val() },
    slave() { return this._offset + game.research().wage() <= game.units.peek()[1].num.val() },
    hotshot() { return this._offset + game.research().sales() <= game.units.peek()[2].num.val() },
    middle() { return !game.locked().outgoingMail && this._offset + game.research().manager() <= game.units.peek()[3].num.val() }
  };
  doScience() {
    if( game.goals().currentNoResearch() ) return
    if( game.research().patents().length > 0 ) game.research().sellPatents();
    if( this.#more.intern() || this.#more.slave() /*|| this.#more.hotshot()*/ || this.#more.middle() ) {
      if( game.research().active() ) game.research().toggleProduction() // off
      // simply assign all | we will need the storage ( for motivational emails #wink )
      game.research().assignMax();
      game.research().sales(0);
      if( game.locked().outgoingMail ) game.research().manager(0)
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
    let _noFreeSlot = game.activeInvestments().length === game.simultaneousInvestments.val();
    if( _noFreeSlot || game.goals().currentNoInvest() || game.obstacles().downturned() ) return
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
    let _nothingToDivest = 0 === game.pendingInvestmentCount.val();
    let _ongoingAcquisition = 1 === game.activeAcquisitions().length;
    if( _nothingToDivest || _ongoingAcquisition || game.obstacles().downturned()) return
    if( game.locked().acquisitions ) return game.cashOutAllInvestments() // no fancy dancy
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
    doubleBonus: function() { return ( 2 * game.stats[38].val() ) < game.nextBankruptcyBonus.val() }
  }
  theRealThing() {
    this.clearAllIntervals();
    this.#gameState.setBack();
    game.restartGame();
    this.lazilyKickOffOuterLoop()
  }
  #additionalGoals = [
    game.goals().currentNoMail(),
    game.goals().currentNoInvest(),
    game.goals().currentNoResearch(),
    game.goals().currentNoAcquisition(),
    game.goals().currentNoElection()
  ];
  #currentObstacles = [
    game.obstacles().workStoppagePossible(),
    game.obstacles().serverCrashPossible(),
    game.obstacles().marketDownturnPossible(),
    game.obstacles().lawsuitPossible(),
    game.obstacles().disasterPossible()
  ];
  _ms2h( millis ) { return millis / 1000 / 60 / 60 }
  _someStatistix() {
    let _cash = game.cashStats()[0].displayVal();
    let _diff1 = Date.now() - game.stats[19].val();
    let _biz = this._ms2h( _diff1 ).toFixed(2);
    let _g = 0; for( let n = 0; n < this.#additionalGoals.length; n++ ) if( this.#additionalGoals[n] ) _g++
    let _o = 0; for( let u = 0; u < this.#currentObstacles.length; u++ ) if( this.#currentObstacles[u] ) _o++
    let old = game.stats[38].val();
    let _inc = ( ( old + game.nextBankruptcyBonus.val() ) / old ).toFixed(2);
    let _diff2 = _diff1 - game.goals().timeLimitGoal().goal;
    let _bb = 0 > _diff2 ? "before" : "behind";
    let _est = this._ms2h( _diff2 ).toFixed(2);

    let _msg = `you just made ${_cash} in about ${_biz} hours\n\nwith ${_g} additional goals set, and ${_o} obstacles active\n\nyou are ${_est} hours ${_bb} your chosen time-goal | next game might be ${_inc} times faster`;
    alert(_msg)
  }
  _haltTheBiz() {
    this.clearAllIntervals();
    game.buyRate('max');
    for( let n = 11; n >= 0; n-- ) {
      if( game.units()[n].workStopped() ) continue
      game.units()[n].sell()
    } // firing all units automatically stops investment, due to low income
    if( game.research().active() ) game.research().toggleProduction()
  }
  setGoals() {
    if( game.goals().goalSet() ) return this.theRealThing()
    this._haltTheBiz();
    this._someStatistix()
  }
  bankcruptFallback() {
    if( this.helper.doubleBonus() ) this.setGoals()
  }
  /* quit out as soon as desirable from first game, as this unlocks business-goals
   * ( which further increases the multiplier )
   */
  bankcruptOne() {
    if( this.helper.doubleBonus() ) this.theRealThing()
  }
  bankruptcy() {
    if( this.helper.firstBiz() ) return this.bankcruptOne()
    if( 0 === game.goals().currentBonus() ) return this.bankcruptFallback()
    if( game.goals().earningsGoalMet() ) this.setGoals()
  }
  #acqHelper = {
    burnDown() { return game.activeAcquisitions()[0].currentEmployees.val() / this.initEmp },
    workAround() {
      game.activeAcquisitions()[0].fire();
      if( this.checkVal > this.burnDown() ) {
        let _t = ( ( Date.now() - this.firstStamp ) / 1000 / 60 ).toFixed(1);
        console.warn(`acquisition down to ${this.checkVal} of ${this.initEmp} after approximately ${_t} minutes`);
        this.checkVal = ( this.checkVal - 0.1 ).toFixed(1)
      }
    },
    kickOff() {
      this.checkVal = 0.9;
      this.initEmp = game.activeAcquisitions()[0].initialEmployees;
      if( this.checkVal > this.burnDown() ) this.checkVal = this.burnDown().toFixed(1)
      this.firstStamp = parseInt(game.activeAcquisitions()[0].id);
      this.intervalId = setInterval(this.workAround.bind(this), 80)
    },
    setBack() {
      this.intervalId = clearInterval( this.intervalId )
    }
  };
  chittyChat( _acq ) {
    if( 0 === _acq.chats().length ) return
    let acqChat = _acq.chats()[0]; // do just one | we come back here ( several times a second ;)
    if( acqChat.finished() ) return acqChat.close()
    if( acqChat.messagesFinished ) return
    acqChat.addMessage("You", this.random( this.chatPhrases )) // todo funsies use randomly firstName or lastName ??
  }
  #acqMailDelay = false;
  acqMailCircumventGameBug() {
    game.activeAcquisitions()[0].mail()[0].respond();
    this.#acqMailDelay = false
  }
  acceptPolicies( _acq ) {
    let _noMail = 0 === _acq.mail().length;
    if( _noMail || this.#acqMailDelay ) return
    this.#acqMailDelay = true;
    let _justOne = _acq.mail()[0];
    if( _justOne.replied() ) return // comment out | for possible exploit (;
    _justOne.inputText( _justOne.from + " " + this.#maxBody );
    setTimeout(this.acqMailCircumventGameBug.bind(this), this.currentMailBugTimeout)
  }
  acqHireHelper = {
    layoffs: 0,
    policies: 1,
    fudging: 2,
    chat: 3,
    stillHiring( acq, who ) { return acq.initialPrice.val() > ( acq.cashSpent.val() + who.price.val() ) },
    isAffordable( acq, who ) { return acq.netValue.val() > who.price.val() }
  };
  acqHire( _acq ) {
    let fudge = _acq.workers()[this.acqHireHelper.fudging];
    let stillHiring = this.acqHireHelper.stillHiring( _acq, fudge );
    if( stillHiring && this.acqHireHelper.isAffordable( _acq, fudge ) ) fudge.hire()
    if( !stillHiring ) {
      let layoff = _acq.workers()[this.acqHireHelper.layoffs];
      let _half = layoff.num() / fudge.num();
      if( 0.5 > _half && this.acqHireHelper.stillHiring( _acq, layoff ) &&  this.acqHireHelper.isAffordable( _acq, layoff ) ) layoff.hire()
    }
  }
  microManage() {
    let _noAcquisition = 0 === game.activeAcquisitions().length;
    if( _noAcquisition || game.goals().currentNoAcquisition() || game.obstacles().downturned() ) return
    let acquisition = game.activeAcquisitions()[0]; // in the current game version there is always only 1 acquisition
    if( 1 === game.pendingAcquisitionCount.val() ) {
      this.#acqHelper.setBack();
      acquisition.sell();
      return
    }
    // use some kinda sub-interval to massively accelerate biz termination
    if( undefined === this.#acqHelper.intervalId ) this.#acqHelper.kickOff()
    this.acqHire( acquisition ); // delegation is key here (:
    //this.chittyChat( acquisition ); // todo bugfix
    //this.acceptPolicies( acquisition ) // todo bugfix
  }
  exploitingCurrentGameBug() {
    try {
      game.composedMail().selectedDepartment(4).send()
    } catch( e ) {
      console.warn(`we just avoided game-error ${e}`)
    }
  }
  instantStressRelief( currentLvL) { game.composedMail().lowerStress(1, currentLvL, 1) }
  #antiStress = false;
  outgoingMail() {
    if( game.obstacles().crashed() ) return // maybe cheatpoint, i did not test it
    // cheating point ( 1 ) | resting seems to be a small 3sec time-frame, in which the "normal" mail-interface cannot be used
    if( game.composedMail().resting() ) return // comment out to "overload"
    // cheating point ( 2 ) | above 100 the send-button will be unavailable to "regular" players
    if( 100 < game.composedMail().stressLevel.val() ) {
      //this.instantStressRelief( game.composedMail().stressLevel.val() ) // cheat point ( 3 )
      //this.exploitingCurrentGameBug() // currently a somewhat dirty alternative for total stress relief ^^
      this.#antiStress = true // comment out, to just spam departments ( beyond real )
    }
    if( 50 > game.composedMail().stressLevel.val() ) this.#antiStress = false
    /* spamming an inactive department, will provoke a mailer-deamon in your inbox
     * ( and guess what: you can reply to that .. and generate money )
     * ( ? ) "motivating" acquisition seems to counter effect massive net values
     * TODO encouraging investment during market-downtime might end up in a "foul" investment
     */
    let _d = this.#antiStress ? this.#deps.hr : this.random( [ this.#deps.inv, this.#deps.rd, this.#deps.train ] );
    let _u = this.random( ["0", "1", "2"] ); // cheat-hint: only 1 of these really make the difference (;
    let _r = this.#maxReceiver; let _s = this.#maxSubject; let _m = this.#maxBody;

    game.composedMail().selectedDepartment( _d ).selectedUrgency( _u ).to( _r ).subject( _s ).message( _m ).send()
  }
  guaranteedWindfall() {
    if( 100 > game.windfallProgress.val() ) return
    game.triggerManualWindfall()
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
  untilWindfallGuarantee() {
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
  // doin 10+ things, in a split second, totally sound like Automat ( but will ultimately "break" parts of the game flow .. )
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
    this.outgoingMail();
    this.guaranteedWindfall()
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
        if( game.locked().mail ) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilInvestments.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitInvest:
        if( game.locked().investments ) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilResearchAndDevelopment.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitScience:
        if( game.locked().research ) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilBankruptcy.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitBankrupt:
        if( game.locked().bankruptcy ) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilAcquisitions.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitAcq:
        if( game.locked().acquisitions ) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilOutgoingMail.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitOutG:
        if( game.locked().outgoingMail ) break
        clearInterval(this.#innerLoopId);
        this.#gameState.setNext();
        this.#innerLoopId = setInterval(this.untilWindfallGuarantee.bind(this), this.innerLoopMillis);
        break
      case this.#gameState.waitWindfallG:
        if( game.locked().windfallGuarantee ) break
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
        this.#gameState.setBack()
    }
  }
  lazilyKickOffOuterLoop() {
    clearInterval(this.#outerLoopId);
    this.#outerLoopId = setInterval(this.manageStateOfInnerLoop.bind(this), this.outerLoopMillis)
  }
  clearAllIntervals() {
    clearInterval(this.#outerLoopId);
    clearInterval(this.#innerLoopId);
    this.#acqHelper.setBack()
  }
  constructor() {
    this.#gameState.init();
    this.lazilyKickOffOuterLoop();
    // IF sht goes sideways, you can't even read the error messages, as they might fly-in 10 times a second on the browser console
    window.onerror = this.clearAllIntervals.bind(this)
  }
}; let _ica = new IdleClassAutomat()
