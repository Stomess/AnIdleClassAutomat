"use strict";
/* An Idle Class Automat v3.4.7
 * Base structure shamelessly lended from argembarger (:
 * During development constantly tested in Firefox on Linux with game version 0.8.2
 * If it crashes your game, browser, machine, life.. start over ( or write your own stuff )
 */
class IdleClassAutomat {
  // TODO setter
  outerLoopMillis = 4000; // checks the game progress | every 4 seconds
  innerLoopMillis = 300; // handle most of the game for you | every 0.3 seconds
  cashSpendOnUpgrades = 1.0; // ration 0.67 = 67%
  acquisitionStopHiringFraction = 0.666; // Default 0.666, stops hiring acq employees at less than 66.6% workers remaining, RATIO VALUE, 0.67 = 67%
  bankruptcyResetFraction = 2.0; // ratio 0.67 = 67%

  // @see https://www.reddit.com/r/TheIdleClass/comments/ehd9u1/the_absolute_best_text_bonus_for_emails/
  bizzWords = ["ASAP", "B2B", "B2C", "BYOD", "CTR", "EBITDA", "EOD", "KPI", "ROI", "SEO", "SAAS", "accelerator", "action", "advertainment", "agile", "analytic", "bandwidth", "ballpark", "best practice", "blue sky thinking", "boot strap", "bootstrap", "brand", "bubble", "cash flow", "churn rate", "circle back", "client", "content marketing", "crowdfund", "crowdsource", "customer", "deep dive", "deliverable", "digital nomad", "disrupt", "downsiz", "drill down", "dynamism", "early adopter", "end-user", "end user", "enterprise", "equity", "evangelist", "evergreen", "executive", "exit strategy", "freemium", "gamification", "gamified", "globalization", "growth hack", "golden parachute", "hacking", "holistic", "hyperlocal", "ideat", "influencer", "innovat", "intellectual property", "invest", "iterat", "layoff", "leverage", "market", "millennial", "mission", "monetiz", "moving forward", "optimiz", "outsourc", "overhead", "paradigm", "pivot", "profit", "redundanc", "revenue", "sale", "scaleable", "share", "shareholder", "stakeholder", "startup", "stock", "synergy", "thought leader", "trim the fat", "unicorn", "valuation", "visionary", "wheelhouse", "wunderkind"];
  // TODO exchange with shakespeare ipsum ( api ( if possible ) )
  autoChatPhrases = ["... Are you seriously wasting my time like this?", ", I really don't want to hear about it.", ", do you feel ready to fire your friends?", ", you put our glorious company to shame.", "!! Guess what?? You are an ass!", ", have you considered getting back to work?", ": I love hearing from you, almost as much as I hate it.", " is such a freakin tool, I mean really, they... oh ww lol!", " -- this better be good news.", ": ¯\_(ツ)_/¯", ", hold on, I'm playing this idle game called The Idle Class", ", hold on, my Trimps are just about to hit my target zone...", "!! Guess what?? Hevipelle eats ass!"];

  currentBankruptcyStatsIndex = 38; // Current bankruptcy bonus in game.stats[]

  // Everything else is private
  #currOuterProcessHandle = 0;
  #currProcess = 0;
  #currProcessHandle = 0;
  #currUpgrade;
  #currEmployee;
  #currMail;
  #currOutgoing;
  #outgoingMailDelay = 0;
  #invBought;
  #invChecks;
  #invTargetMins;
  #invTargetMs;
  #invFoundTarget;
  #invSorted;
  #invAcquired;
  #currAcq;
  #acqCurrWorker;
  #acqCurrChat;
  #acqCurrMail;

  autocratSelfNaming() {
    if(game.businessName().name() !== "Unnamed Business") return;
    let pastBizCheckIndex = -1;
    let maxKnownBusiness = -1;
    while(pastBizCheckIndex < game.pastBusinesses().length - 1) {
      pastBizCheckIndex = pastBizCheckIndex + 1;
      let pastBizName = game.pastBusinesses()[pastBizCheckIndex].name;
      if(pastBizName.startsWith("AutoBiz#")) {
        let foundBiz = parseInt(pastBizName.substr(pastBizName.indexOf("#") + 1, pastBizName.length), 10);
        if(foundBiz > maxKnownBusiness) maxKnownBusiness = foundBiz;
      }
    }
    game.businessName().newName("AutoBiz#" + (maxKnownBusiness + 1));
    game.businessName().save();
  };
  unlockCartel() {
    if( 1 === game.communityLocked.val() ) return;
    game.cartel.unlock()
  };
  randomBizWord() {
    return this.bizzWords[Math.floor(Math.random() * this.bizzWords.length)];
  };
  randomDialogue() {
    return this.autoChatPhrases[Math.floor(Math.random()*this.autoChatPhrases.length)];
  };

  autoEarnDollars() {
    game.addManualClicks();
    $(".top-click-value-display").text(game.earnedPerClick.displayVal()).fadeToggle()
  };
  autoUpgrade() {
    if(this.cashSpendOnUpgrades >= 1.0) {
      game.buyAllUpgrades();
    } else {
      for(let i = 0; i < game.availableUpgrades().length; i++) {
        this.#currUpgrade = game.availableUpgrades()[i];
        if(this.#currUpgrade.price.val() < (game.currentCash.val() * this.cashSpendOnUpgrades)) {
          this.#currUpgrade.buy();
        }
      }
    }
  };
  autoHR() {
    // reverse the loop | in favour of more "productive" units
    for(let i = 11; i >= 0; i--) {
      this.#currEmployee = game.units.peek()[i];
      // No cheating, Sir (:
      if(!this.#currEmployee.available()) continue;
      // Based on current share of total income
      let fairShare = parseFloat(this.#currEmployee.shareOfTotal()) / 100;
      // ( if possible ) always buy til first 5 | to activate next higher unit
      if(this.#currEmployee.num.val() <= 4 && (this.#currEmployee.price.val() <= game.currentCash.val())) {
        this.#currEmployee.buy();
      } else if(this.#currEmployee.price.val() < (game.currentCash.val() * fairShare)) {
        this.#currEmployee.buy();
      }
    }
  };
  autoMail() {
    this.autoOutgoingMail();
    // Automatically replies to emails with "<sender_name>: <string_of_biz_babble>"
    for(let i = game.mail().length - 1; i >= 0; i--) {
      this.#currMail = game.mail()[i];
      // EMAIL CHEAT: You can uncomment the following line to exploit emails
      if(this.#currMail.replied() === true) { continue; }
      this.#currMail.inputText(this.#currMail.from + ",");
      while(this.#currMail.inputText().length < 180) {
        this.#currMail.inputText(this.#currMail.inputText() + " " + this.randomBizWord());
      }
      // Uncomment to catch what these actually are in console, for funsies :)
      //console.log("" + this.#currMail.inputText());
      this.#currMail.respond();
    }
  };
  autoOutgoingMail() {
    // Send random emails to departments unless stress is above 50% (then spam to HR)
    if(game.locked().outgoingMail === false && game.composedMail().resting() === false && this.#outgoingMailDelay === 0) {
      this.#outgoingMailDelay = 1;
      this.#currOutgoing = game.composedMail();
      if(this.#currOutgoing.stressLevel.val() > 50) {
        // Human Resources
        this.#currOutgoing.selectedDepartment('4');
      } else {
        // Random other. 0 = investments, 1 = r&d, 2 = acquisitions. R&D is available before investments.
        let r = Math.random();
        // No acquisitions; constrain to [0...0.666], or 1 or 0
        if(game.activeInvestments().length === 0) { r = r * 0.666; }
        // No investments; additionally constrain to [0...0.333], or just 1
        if(game.activeInvestments().length === 0) { r = r * 0.5; }
        this.#currOutgoing.selectedDepartment((r <= 0.333) ? '1' : ((r <= 0.666) ? '0' : '2'));
        r = Math.random();
        this.#currOutgoing.selectedUrgency((r <= 0.333) ? '1' : ((r <= 0.666) ? '0' : '2'));
      }
      this.#currOutgoing.to("John Wayne");
      this.#currOutgoing.subject(this.randomDialogue());
      while(this.#currOutgoing.message().length < 180) {
        this.#currOutgoing.message(this.#currOutgoing.message() + " " + this.randomBizWord());
      }
      setTimeout(this.autoSendMail, 2000);
      setTimeout(this.autoStopWaitingForMail, 5000);
    }
  }
  autoSendMail() {
    game.composedMail().send();
  };
  autoStopWaitingForMail() {
    activeIdleClassAutocrat.#outgoingMailDelay = 0;
  };
  // little r&d-helper | to improve readability of if-statement
  more(dict, offset = 10) {
    let name = Object.keys(dict)[0];
    let value = dict[name];

    return game.research()[name]() + offset <= game.units.peek()[value].num.val()
  }
  /* just assign fckn all
   * we will need the storage | for motivational emails #wink
   * there are good reasons to turn away from your business from time to time
   * ( that's when you need autosell )
   */
  autoScience() {
    if( game.research().patents().length > 0 ) game.research().sellPatents();
    // just preparing some real js-magic here
    let intern = 0, wage = 1, sales = 2, manager = 3; // TODO see if we can do nicer than this
    // simon sayz: only switch the machine off, if there are @ least 10 emps to "deploy" (:
    if( this.more({intern}) || this.more({wage}) || this.more({sales}) || this.more({manager}) ) {
      if( game.research().active() ) game.research().toggleProduction(); // off
      game.research().assignMax();
      game.research().toggleProduction(); // back on
    }
  };
  autoInvest() {
    if(game.activeInvestments().length < game.simultaneousInvestments.val()) {
      this.#invBought = false;
      this.#invChecks = 0;
      // Check existing investment target times, fill shortest-found slot
      // Remember that target time is in milliseconds; 1 min = 60000 ms
      // Desired target times by default are 1, 12, 70, 1:59, 2:59, etc...
      // Desired percentages by default are based on number of slots
      // 1 slot = 50%, 2 = 40%, 3 = 30%, 4 = 20%, 5+ = 10%
      while(this.#invBought === false) {
        this.#invTargetMins = 1;
        this.#invTargetMs = 60000;
        this.#invFoundTarget = false;
        if(this.#invChecks === 1) {
          this.#invTargetMins = 12;
          this.#invTargetMs = 12 * 60000;
        }
        else if(this.#invChecks === 2) {
          this.#invTargetMins = 70;
          this.#invTargetMs = 70 * 60000;
        }
        else if(this.#invChecks > 2) {
          this.#invTargetMins = 59 + (60 * (this.#invChecks - 2));
          this.#invTargetMs = this.#invTargetMins * 60000;
        }
        for(let i = 0; i < game.activeInvestments().length; i++) {
          if(game.activeInvestments()[i].targetTime === this.#invTargetMs) {
            this.#invFoundTarget = true;
          }
        }
        if(this.#invFoundTarget === true) {
          this.#invChecks++;
        } else {
          this.#invBought = true;
          game.makeInvestment(Math.max(60 - (game.simultaneousInvestments.val() * 10), 10), this.#invTargetMins);
        }
      }
    }
  };
  autoDivest() {
    if(game.pendingInvestmentCount.val() > 0) {
      for(let i = game.activeInvestments().length - 1; i >= 0; i--) {
        // Auto Sell
        if(game.activeInvestments()[i].timeRemaining() === 0) {
          // Auto Acquire
          if(game.locked().acquisitions === false && game.simultaneousInvestments.val() > 1 && game.activeAcquisitions().length < game.simultaneousAcquisitions.val()) {
            // Only acquire investments if some better investment is not closer to completion than
            // half of the finished investment's original target time.
            this.#invSorted = game.activeInvestments().slice();
            this.#invAcquired = false;
            this.#invSorted.sort(function(a, b){return b.targetTime - a.targetTime});
            for(let j = 0; j < this.#invSorted.length; j++) {
              if(this.#invSorted[j].targetTime === game.activeInvestments()[i].targetTime) {
                this.#invAcquired = true;
                break;
              } else if(this.#invSorted[j].timeRemaining() < game.activeInvestments()[i].targetTime * 0.5) {
                break;
              }
            }
            if(this.#invAcquired === false) {
              game.activeInvestments()[i].handlePayout();
            } else {
              game.activeInvestments()[i].handleAcquisition();
            }
          } else if(game.pendingAcquisitionCount.val() === 0) {
            // ONLY pay out if there ISN'T a currently-pending acquisition.
            // If an acquisition is actively paying out, do nothing, simply wait.
            game.activeInvestments()[i].handlePayout();
          }
        }
      }
    }
  };
  autoBankruptcy() {
    // i suggest always check out from the first game as soon as possible | as this unlocks goals ( wich further increases the multiplier )
    if( game.bankruptcies.val() === 0 || game.nextBankruptcyBonus.val() > game.stats[this.currentBankruptcyStatsIndex].val() * this.bankruptcyResetFraction ) {
      this.#currProcess = 0;
      game.restartGame();
    }
  };
  autoMicromanage() {
    for (let i = game.activeAcquisitions().length - 1; i >= 0; i--) {
      this.#currAcq = game.activeAcquisitions()[i];
      // Acquisition Clicker
      this.#currAcq.fire();

      // Acquisition AutoAssign
      if(this.#currAcq.currentEmployees.val() > this.#currAcq.initialEmployees * this.acquisitionStopHiringFraction) {
        for(let j = 0; j < this.#currAcq.workers().length; j++) {
          this.#acqCurrWorker = this.#currAcq.workers()[j];
          if(this.#acqCurrWorker.price.val() < game.currentCash.val()) {
            this.#acqCurrWorker.hire();
          }
        }
      }

      // Acquisition AutoChat
      // The cleanest way to handle these is by using the document elements.
      for(let j = this.#currAcq.chats().length - 1; j >= 0; j--) {
        this.#acqCurrChat = this.#currAcq.chats()[j];
        if(this.#acqCurrChat.finished() === true) {
          this.#acqCurrChat.close();
        } else if(this.#acqCurrChat.messages().length > 0 && this.#acqCurrChat.messages()[this.#acqCurrChat.messages().length - 1].source !== "You") {
          this.#acqCurrChat.select();
          document.getElementById('chat-response').value = this.#acqCurrChat.name + this.randomDialogue();
          document.getElementsByClassName("chat-submit")[0].click();
        }
      }

      // Acquisition AutoPolicy
      for(let j = this.#currAcq.mail().length - 1; j >= 0; j--) {
        this.#acqCurrMail = this.#currAcq.mail()[j];
        if(this.#acqCurrMail.replied() === true) { continue; }
        this.#acqCurrMail.inputText(this.#acqCurrMail.from + ",");
        while(this.#acqCurrMail.inputText().length < 180) {
          this.#acqCurrMail.inputText(this.#acqCurrMail.inputText() + " " + this.randomBizWord());
        }
        this.#acqCurrMail.respond();
      }

      // Acquisition Sell
      if(this.#currAcq.sold() === false && this.#currAcq.currentEmployees.val() === 0) {
        this.#currAcq.sell();
      }
    }
  };

  autoUntilEmails() {
    this.autoEarnDollars();
    this.autoUpgrade();
    this.autoHR();
  };
  autoUntilInvestments() {
    this.autoEarnDollars();
    this.autoUpgrade();
    this.autoHR();
    this.autoMail();
  };
  autoUntilResearchAndDevelopment() {
    this.autoEarnDollars();
    this.autoUpgrade();
    this.autoHR();
    this.autoMail();
    this.autoInvest();
    this.autoDivest();
  };
  autoUntilBankruptcy() {
    this.autoEarnDollars();
    this.autoUpgrade();
    this.autoHR();
    this.autoMail();
    this.autoInvest();
    this.autoDivest();
    this.autoScience();
  };
  autoUntilAcquisitions() {
    this.autoEarnDollars();
    this.autoUpgrade();
    this.autoHR();
    this.autoMail();
    this.autoInvest();
    this.autoDivest();
    this.autoScience();
    this.autoBankruptcy();
  };
  autoUntilInfinity() {
    this.autoEarnDollars();
    this.autoUpgrade();
    this.autoHR();
    this.autoMail();
    this.autoInvest();
    this.autoDivest();
    this.autoScience();
    this.autoBankruptcy();
    this.autoMicromanage();
  };

  manageStateOfInnerLoop() {
    this.autocratSelfNaming();
    this.unlockCartel();
    switch(this.#currProcess) {
      case 0: // Not running; new Autocrat state. Clear any existing loop and start pre-email loop.
        this.#currProcess = 1;
        clearInterval(this.#currProcessHandle);
        this.#currProcessHandle = setInterval(this.autoUntilEmails.bind(this), this.innerLoopMillis);
        break;
      case 1: // Wait for emails before changing loop to pre-Investments loop.
        if(game.locked().mail === true) { break; }
        this.#currProcess = 2;
        clearInterval(this.#currProcessHandle);
        this.#currProcessHandle = setInterval(this.autoUntilInvestments.bind(this), this.innerLoopMillis);
        break;
      case 2: // Wait for Investments before changing loop to pre-R&D loop.
        if(game.locked().investments === true) { break; }
        this.#currProcess = 3;
        clearInterval(this.#currProcessHandle);
        this.#currProcessHandle = setInterval(this.autoUntilResearchAndDevelopment.bind(this), this.innerLoopMillis);
        break;
      case 3: // Wait for R&D before changing loop to pre-Bankruptcy loop.
        if(game.locked().research === true) { break; }
        this.#currProcess = 4;
        clearInterval(this.#currProcessHandle);
        this.#currProcessHandle = setInterval(this.autoUntilBankruptcy.bind(this), this.innerLoopMillis);
        break;
      case 4: // Wait for Bankruptcy before changing loop to pre-Acquisitions loop
        if(game.locked().bankruptcy === true) { break; }
        this.#currProcess = 5;
        clearInterval(this.#currProcessHandle);
        this.#currProcessHandle = setInterval(this.autoUntilAcquisitions.bind(this), this.innerLoopMillis);
        break;
      case 5: // Wait for Acquisitions before changing loop to pre-Infinity loop
        if(game.locked().acquisitions === true) { break; }
        this.#currProcess = 6;
        clearInterval(this.#currProcessHandle);
        this.#currProcessHandle = setInterval(this.autoUntilInfinity.bind(this), this.innerLoopMillis);
        break;
        break;
      case 6: // just fckn run forevor | until the somewhat parallel condition-check sayz something else -- or we define some nu shit to handle ( like elections )
        break;
      default:
        this.#currProcess = 0;
    }
  };

  lazilyKickOffOuterLoop() {
    clearInterval(this.#currOuterProcessHandle);
    this.#currOuterProcessHandle = setInterval(this.manageStateOfInnerLoop.bind(this), this.outerLoopMillis);
  };

  clearBothIntervals() {
    clearInterval(this.#currOuterProcessHandle);
    clearInterval(this.#currProcessHandle)
  }

  constructor() {
    this.lazilyKickOffOuterLoop();
    // IF sht goes sideways, you can't even read the error messages, as they might fly-in 10 times a second on the browser console
    window.onerror = this.clearBothIntervals.bind(this);
  }
}

// Actually kicks off the Autocrat.
var activeIdleClassAutocrat = new IdleClassAutomat();
