var States = {};

States.MainMenu = function(){ }; 

States.MainMenu.prototype = { 
    preload : function(){ 
        // load basic assets for this state 
        
        this.load.image('beginButton','assets/beginButton.png'); 
        this.load.image('titleBack','assets/titleBack.png'); 
    
    }, 

    create : function(){ 

        // place the assets and elements in their initial positions, create the state 
    
        this.titleBack = this.add.sprite(0,0,'titleBack'); 
        this.beginButton = this.add.sprite(400,450,'beginButton');
        this.beginButton.anchor.setTo(0.5,0.5);
        this.beginButton.inputEnabled='true'
        this.beginButton.events.onInputDown.add(loginUser);
        this.beginButton.input.useHandCursor = true;
        
        function loginUser()
        {
            var ref = new Firebase("https://maestroclass.firebaseio.com");
            ref.authWithOAuthPopup("google", function(error, authData) {
              if (error) {
                console.log("Login Failed!", error);
              } else {
                console.log("Authenticated successfully with payload:", authData);
                game.user = authData;
                game.state.start('GetClasstag');
              }
            });
        }
    
    }, 

    update : function(){ 
    
        // your game loop goes here 
    
        //this.titleName.x++; 
    } 
};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', States.MainMenu);
game.state.add('MainMenu',States.MainMenu);

States.GetClasstag = function(){ }; 
States.GetClasstag.prototype = { 
    preload : function(){ 
        // load basic assets for this state 
    
        this.load.image('classTagBack','assets/classTagBack.png'); 
    
    }, 

    create : function(){ 

        // place the assets and elements in their initial positions, create the state 

        this.classTagBack = this.add.sprite(0,0,'classTagBack'); 
        
        var boxX = 700;
        var boxY = 70;
        this.tagBox = this.add.graphics(400, 300);
        this.tagBox.beginFill(0xFFFFFF);  //dark blue
        this.tagBox.lineStyle(0, 0x000000, 1);
        this.tagBox.drawRect(-boxX/2, -boxY/2, boxX, boxY);
        this.tagBox.endFill();
        
        this.hashMark = game.add.text(70,300, '#'  )
        this.hashMark.anchor.setTo(0,0.5);
        this.hashMark.font = 'Arial';
        this.hashMark.fontSize = 48;
        this.hashMark.fill = '#000000';
        
        game.typedText = '';
        game.typing = true;
        var tagText = game.add.text(100,300, game.typedText  )
        tagText.anchor.setTo(0,0.5);
        tagText.font = 'Arial';
        tagText.fontSize = 48;
        tagText.fill = '#000000';
        
        var ignoreKeys = [9,16,17,18,32,186,187,188,189,190,191,192,219,220,221,222]
        var maxTagLength = 20;
        game.input.keyboard.onDownCallback = function() {
            if(game.typing && game.classtag == undefined)
            {
                console.log(game.input.keyboard.event.keyCode)
                if(game.input.keyboard.event.keyCode == 8) //backspace
                {
                    game.typedText = game.typedText.substring(0, game.typedText.length - 1);
                } else if(game.input.keyboard.event.keyCode == 13) //enter
                {
                    game.typing=false;
                    if(game.state.current == 'GetClasstag')
                    {
                        tagExists();
                        game.classtag = game.typedText;
                        
                    }

                } else if(ignoreKeys.indexOf(game.input.keyboard.event.keyCode) > -1 )
                {
                    //do nothing
                } else
                {
                    if(game.typedText.length < maxTagLength)
                    {
                        game.typedText += String.fromCharCode(game.input.keyboard.event.keyCode);
                    } else
                    {
                        game.typedText = String.fromCharCode(game.input.keyboard.event.keyCode);
                    }    
                }
                console.log(game.typedText)
                tagText.setText(game.typedText);
            }

        };
        
        function tagExists()
        {
            
            // Get a database reference to our posts
            var ref = new Firebase("https://maestroclass.firebaseio.com/classtags/"+game.typedText)
            // Attach an asynchronous callback to read the data at our posts reference
            ref.on("value", function(snapshot) {
                if(game.doneSearching != true)
                {
                    if(snapshot.val() != null )
                      {
                          console.log("found classtag!")
                          var currentTime = new Date().getTime();
                          console.log((currentTime - snapshot.val().updateTime ) + "ms old")
                          if(currentTime - snapshot.val().updateTime  > 3600000)
                          {
                              console.log("stale table found!");
                            //   
                            if(snapshot.val().teacheruid == game.user.uid)
                            {
                                console.log("recovering table")
                                game.state.start('PickQuestionType');
                                
                            } else
                            {
                                console.log("claiming as own")
                                game.state.start('VerifyTeacher');
                            }
                            
                          } else
                          {
                              console.log("fresh table found!")
                              if(snapshot.val().teacheruid == game.user.uid)
                                {
                                    console.log("recovering table")
                                    game.state.start('PickQuestionType');
                                    
                                } else if(!game.doneSearching)
                                {
                                    game.doneSearching=true;
                                    console.log("joining as student")
                                    addMessageListener();
                                    addStudentTyping();
                                    game.state.start('PollForQuestion');
                                }
                          }
                          
                      } else
                      {
                          console.log("doesn't exist")
                          game.state.start('VerifyTeacher');
                      }
                    
                }
              
            }, function (errorObject) {
              console.log("The read failed: " + errorObject.code);
            });
            
        }
        function addMessageListener()
        {
            var ref = new Firebase("https://maestroclass.firebaseio.com/classtags/"+game.classtag+"/messages");
                ref.orderByChild("updateTime").on("child_added", function(snapshot) {
                  console.log(snapshot.key());
                  console.log(snapshot.val());
                  console.log(game.lastUpdate)
                  if(snapshot.val().uid == game.user.uid)
                  {
                      console.log("MESSAGE: " + snapshot.val().message);
                      game.infoAlert(snapshot.val().message)
                  }
            });    
        }
    }, 

    update : function(){ 
    
        // your game loop goes here 
    
        //this.titleName.x++; 
    } 
};
game.state.add('GetClasstag',States.GetClasstag);

States.VerifyTeacher = function(){ }; 
States.VerifyTeacher.prototype = { 
    preload : function(){ 
        // load basic assets for this state 
        
        this.load.image('verifyStudent','assets/verifyStudent.png'); 
        this.load.image('verifyTeacher','assets/verifyTeacher.png'); 
        this.load.image('blankBack','assets/blankBack.png'); 
        
    }, 
    
    create : function(){ 
    
        // place the assets and elements in their initial positions, create the state 
    
        this.verifyTeacherBack = this.add.sprite(0,0,'blankBack'); 
        var verifyQuestion = game.add.text(400,100, 'Checking for existing class...' );
        verifyQuestion.anchor.setTo(0.5,0.5);
        verifyQuestion.font = 'Arial';
        verifyQuestion.fontSize = 48;
        verifyQuestion.fill = '#FFFFFF';
        
        game.time.events.add(Phaser.Timer.SECOND * 2, displayQuestion);
        
        function displayQuestion()
        {
            verifyQuestion.setText('Are you a teacher or a student?');
            
            game.verifyTeacher = game.add.sprite(500,450,'verifyTeacher');
            game.verifyTeacher.anchor.setTo(0.5,0.5);
            game.verifyTeacher.inputEnabled='true'
            game.verifyTeacher.events.onInputDown.add(startTeacherCyle);
            game.verifyTeacher.input.useHandCursor = true;
            
            game.verifyStudent = game.add.sprite(300,450,'verifyStudent');
            game.verifyStudent.anchor.setTo(0.5,0.5);
            game.verifyStudent.inputEnabled='true'
            game.verifyStudent.events.onInputDown.add(redoClassTag);
            game.verifyStudent.input.useHandCursor = true;  
        }

        
        function startTeacherCyle()
        {
            game.state.start('PickQuestionType');
        }
        
        function redoClassTag()
        {
            game.classtag = undefined;
            game.state.start('GetClasstag');
        }
        
    }, 
    


    update : function(){ 

    // your game loop goes here 

    //this.titleName.x++; 
    } 
};
game.state.add('VerifyTeacher',States.VerifyTeacher);

States.PickQuestionType = function(){ }; 
States.PickQuestionType.prototype = { 
    preload : function(){ 
        // load basic assets for this state 
        this.load.image('blankBack','assets/blankBack.png'); 
        this.load.image('draggerButton','assets/draggerButton.png'); 
        this.load.image('multChoiceSelectButton','assets/multChoiceSelectButton.png'); 
        this.load.image('thisThatButton','assets/thisThatButton.png');
        this.load.image('typeInButton','assets/typeInButton.png');
        
    }, 

    create : function(){ 
        game.doneSearching = true;
        var ref = new Firebase("https://maestroclass.firebaseio.com/");
            var updateTime = new Date()
            updateTime = updateTime.getTime();
            var tagsRef = ref.child("classtags/"+game.classtag);
            tagsRef.set({
            teacher: game.user.google.displayName,
            teacheruid: game.user.uid,
            updateTime: updateTime,
            intermission: true
        }); 

        
        // place the assets and elements in their initial positions, create the state 
        this.blankBack = this.add.sprite(0,0,'blankBack');
        
        this.typeInfo = game.add.text(400,100, 'Choose a question type:' );
        this.typeInfo.anchor.setTo(0.5,0.5);
        this.typeInfo.font = 'Arial';
        this.typeInfo.fontSize = 48;
        this.typeInfo.fill = '#FFFFFF';
        
        this.draggerButton = this.add.sprite(250,325,'draggerButton');
        this.draggerButton.anchor.setTo(0.5,0.5);
        this.draggerButton.inputEnabled='true'
        this.draggerButton.events.onInputDown.add(getDraggerInfo);
        this.draggerButton.input.useHandCursor = true;
        
        function getDraggerInfo()
        {
            //get dragger info
            game.user.questionType = 'dragger';
            game.state.start('DesignQuestion')
        }
        
        this.multChoiceSelectButton = this.add.sprite(250,475,'multChoiceSelectButton');
        this.multChoiceSelectButton.anchor.setTo(0.5,0.5);
        this.multChoiceSelectButton.inputEnabled='true'
        this.multChoiceSelectButton.events.onInputDown.add(getMultiInfo);
        this.multChoiceSelectButton.input.useHandCursor = true;
        
        function getMultiInfo()
        {
            game.user.questionType = 'multi';
            game.state.start('DesignQuestion')
        }
        
        this.thisThatButton = this.add.sprite(550,325,'thisThatButton');
        this.thisThatButton.anchor.setTo(0.5,0.5);
        this.thisThatButton.inputEnabled='true'
        this.thisThatButton.events.onInputDown.add(getThisThatInfo);
        this.thisThatButton.input.useHandCursor = true;
        
        function getThisThatInfo()
        {
            game.user.questionType = 'thisThat';
            game.state.start('DesignQuestion')
        }
        
        this.typeInButton = this.add.sprite(550,475,'typeInButton');
        this.typeInButton.anchor.setTo(0.5,0.5);
        this.typeInButton.inputEnabled='true'
        this.typeInButton.events.onInputDown.add(getTypeInInfo);
        this.typeInButton.input.useHandCursor = true;
        
        function getTypeInInfo()
        {
            game.user.questionType = 'typeIn';
            game.state.start('DesignQuestion')
        }
        
        
    }, 

    update : function(){ 

        // your game loop goes here 
    
        //this.titleName.x++; 
    } 
};
game.state.add('PickQuestionType',States.PickQuestionType);

States.DesignQuestion = function(){ }; 
States.DesignQuestion.prototype = { 
    preload : function(){ 
        // load basic assets for this state 
        this.load.image('blankBack','assets/blankBack.png'); 
        this.load.image('broadCastButton','assets/broadCastButton.png'); 
        this.load.image('choiceScale','assets/choiceScale.png'); 
        this.load.image('choiceSlider','assets/choiceSlider.png'); 
        this.load.image('multChoiceSelection','assets/multChoiceSelection.png'); 
        this.load.image('multSelectSelection','assets/multSelectSelection.png'); 
    }, 

    create : function(){ 
        // place the assets and elements in their initial positions, create the state 
        this.blankBack = this.add.sprite(0,0,'blankBack');
        

        
        var menuBack = this.add.graphics(0, 0);
        menuBack.beginFill(0x333333);  //dark blue
        menuBack.lineStyle(0, 0x000000, 1);
        menuBack.drawRect(50, 75, 700, 475);
        menuBack.endFill();
        menuBack.alpha = 0.3;
        
        var typeTitle = game.add.text(400,30, 'test' );
        typeTitle.anchor.setTo(0.5,0.5);
        typeTitle.font = 'Arial';
        typeTitle.fontSize = 48;
        typeTitle.fill = '#FFFFFF';
        
        var titleBackGraphic = game.add.graphics(100, 125);
        titleBackGraphic.beginFill(0x333333);  //gray
        titleBackGraphic.lineStyle(0, 0x000000, 1);
        titleBackGraphic.drawRect(0, 0, 650, 50);
        titleBackGraphic.endFill();
        
        var titleButton = game.add.sprite(400,125,titleBackGraphic.generateTexture())
        titleBackGraphic.destroy();
        titleButton.alpha=0.3;
        titleButton.anchor.setTo(0.5,0.5);
        titleButton.inputEnabled='true'
        titleButton.events.onInputDown.add(resetTitle);
        titleButton.input.useHandCursor = true;
        
        var titleText = 'Click here to enter a question...'
        var titleLabel = game.add.text(100,125, titleText )
        titleLabel.anchor.setTo(0,0.5);
        titleLabel.font = 'Arial';
        titleLabel.fontSize = 24;
        titleLabel.fill = '#FFFFFF';
        game.titleLabel = titleLabel;
        
        
        var broadCastButton = game.add.sprite(400,475,'broadCastButton')
        broadCastButton.anchor.setTo(0.5,0.5);
        broadCastButton.inputEnabled='true'
        broadCastButton.events.onInputDown.add(broadCastQuestion);
        broadCastButton.input.useHandCursor = true;
        
        //this.titleName = this.add.sprite(300,300,'name');
        console.log(game.user.questionType)
        switch(game.user.questionType) {
            case 'thisThat':
                typeTitle.setText('This/That') ;
                buildChoiceQuestion();
                break;
            case 'dragger':
                typeTitle.setText('Dragger') ;
                buildChoiceQuestion();
                break;
            case 'multi':
                typeTitle.setText('Multiple Choice/Select') 
                buildMultiQuestion();
                break;
            case 'typeIn':
                typeTitle.setText('Type-In') 
                buildTypeInQuestion();
                break;
        }
        
        function buildMultiQuestion()
        {
            var choiceScale = game.add.sprite(120,180,'choiceScale')
            
            game.choiceSlider = game.add.sprite(120,370,'choiceSlider')
            game.choiceSlider.anchor.setTo(0.5,0.5);
            game.choiceSlider.inputEnabled='true'
            game.choiceSlider.events.onInputDown.add(dragChoiceSlider);
            game.choiceSlider.events.onInputUp.add(finishDragChoiceSlider);
            game.choiceSlider.dragging=false;
            game.choiceSlider.input.useHandCursor = true;
            game.choiceSliderChosen = 3;
            
            game.choiceIndicator = game.add.text(230,290, game.choiceSliderChosen.toString() )
            game.choiceIndicator.anchor.setTo(0.5,0.5);
            game.choiceIndicator.font = 'Arial';
            game.choiceIndicator.fontSize = 120;
            game.choiceIndicator.fill = '#000000';
            
            var multChoiceSelection = game.add.sprite(575,250,'multChoiceSelection')
            multChoiceSelection.anchor.setTo(0.5,0.5);
            multChoiceSelection.inputEnabled='true'
            multChoiceSelection.events.onInputDown.add(selectMultType, this);
            multChoiceSelection.input.useHandCursor = true;
            multChoiceSelection.type = 'choice'
            
            var multSelectSelection = game.add.sprite(575,325,'multSelectSelection')
            multSelectSelection.anchor.setTo(0.5,0.5);
            multSelectSelection.inputEnabled='true'
            multSelectSelection.events.onInputDown.add(selectMultType, this);
            multSelectSelection.input.useHandCursor = true;
            multChoiceSelection.type = 'select'
            
            var selectGraphic = game.add.graphics(100, 200);
            selectGraphic = game.add.graphics(multChoiceSelection.x, multChoiceSelection.y);
            selectGraphic.lineStyle(4, 0x0000FF, 1);
            selectGraphic.drawRect(-multChoiceSelection.width/2-5, -multChoiceSelection.height/2-5, multChoiceSelection.width+10, multChoiceSelection.height+10);
            game.multiType = 'choice'
            
            function selectMultType(selection)
            {
                    selectGraphic.destroy();
                    selectGraphic = game.add.graphics(selection.x, selection.y);
                    selectGraphic.lineStyle(4, 0x0000FF, 1);
                    selectGraphic.drawRect(-selection.width/2-5, -selection.height/2-5, selection.width+10, selection.height+10);
                    game.multiType = selection.type;            
            }
            
        }
        
        function dragChoiceSlider()
            {
                console.log("dragging")
                game.choiceSlider.dragging=true;
            }
            
            function finishDragChoiceSlider()
            {
                console.log("done dragging")
                game.choiceSlider.dragging=false;
            }
            
        function buildTypeInQuestion()
        {
            //nothing to do here
        }
        
        function buildChoiceQuestion()
        {
            var leftBackGraphic = game.add.graphics(100, 200);
            leftBackGraphic.beginFill(0x333333);  //gray
            leftBackGraphic.lineStyle(0, 0x000000, 1);
            leftBackGraphic.drawRect(0, 0, 250, 200);
            leftBackGraphic.endFill();
            
            var leftButton = game.add.sprite(100,200,leftBackGraphic.generateTexture())
            leftBackGraphic.destroy();
            leftButton.alpha=0.3;
            leftButton.inputEnabled='true'
            leftButton.events.onInputDown.add(resetLeft);
            leftButton.input.useHandCursor = true;
            
            var leftText = game.user.questionType=='dragger'?'1':'TRUE'
            var leftLabel = game.add.text(225,300, leftText )
            leftLabel.anchor.setTo(0.5,0.5);
            leftLabel.font = 'Arial';
            leftLabel.fontSize = 96;
            leftLabel.fill = '#FFFFFF';
            game.leftLabel = leftLabel;
            maxLabel(leftLabel);
            
            var rightBackGraphic = game.add.graphics(100, 200);
            rightBackGraphic.beginFill(0x333333);  //gray
            rightBackGraphic.lineStyle(0, 0x000000, 1);
            rightBackGraphic.drawRect(0, 0, 250, 200);
            rightBackGraphic.endFill();
            
            var rightButton = game.add.sprite(450,200,rightBackGraphic.generateTexture())
            rightBackGraphic.destroy();
            rightButton.alpha=0.3;
            rightButton.inputEnabled='true'
            rightButton.events.onInputDown.add(resetRight);
            rightButton.input.useHandCursor = true;
            
            var rightText = game.user.questionType=='dragger'?'10':'FALSE'
            var rightLabel = game.add.text(575,300, rightText )
            rightLabel.anchor.setTo(0.5,0.5);
            rightLabel.font = 'Arial';
            rightLabel.fontSize = 96;
            rightLabel.fill = '#FFFFFF';
            game.rightLabel = rightLabel;
            maxLabel(rightLabel);
        }
        
        function resetLeft()
        {
            game.typedText = '';
            game.leftLabel.setText('');
            game.typing = true;
            game.typingSide = 'left'
            maxTagLength = 30;
        }
        
        function resetRight()
        {
            game.typedText = '';
            game.rightLabel.setText('');
            game.typing = true;
            game.typingSide = 'right'
            maxTagLength = 30;
        }
        
        function resetTitle()
        {
            game.typedText = '';
            game.titleLabel.setText('');
            game.typing = true;
            game.typingSide = 'title'
            maxTagLength = 100;
        }
        
        function maxLabel(label)
        {
            if(label.width>0 && label.text.length>2)
            {
                
                label.fontSize =label.fontSize*240/label.width;
            } 
            
            if(label.fontSize > 110)
            {
                label.fontSize = 110;
            }
        }
        
        function broadCastQuestion()
        {
            if(game.titleLabel.text == "Click here to enter a question...")
            {
                game.titleLabel.setText("");
            }
            //put the new question on the server here
            var ref = new Firebase("https://maestroclass.firebaseio.com/");
            var updateTime = new Date()
            updateTime = updateTime.getTime();
            var tagsRef = ref.child("classtags/"+game.classtag);

            tagsRef.set({
                teacher:        game.user.google.displayName,
                teacheruid:     game.user.uid,
                updateTime:     updateTime,
                questionType:   game.user.questionType,
                titleLabel:     game.titleLabel.text ,
                rightLabel:     (game.user.questionType == 'dragger' || game.user.questionType == 'thisThat' ? game.rightLabel.text : null) ,
                leftLabel:      (game.user.questionType == 'dragger' || game.user.questionType == 'thisThat' ? game.leftLabel.text : null) ,
                choices:        (game.user.questionType == 'multi'  ? game.choiceIndicator.text : null) ,
                multiType:      (game.user.questionType == 'multi'  ? game.multiType : null) ,
                
            }); 
            game.state.start('ShowAnswers');
        }
        
        var ignoreKeys = [9,16,17,18,186,187,188,189,190,192,219,220,221,222]
        var maxTagLength = 30;
        game.input.keyboard.onDownCallback = function() {
            if(game.typing)
            {
                console.log(game.input.keyboard.event.keyCode)
                if(game.input.keyboard.event.keyCode == 8) //backspace
                {
                    game.typedText = game.typedText.substring(0, game.typedText.length - 1);
                } else if(game.input.keyboard.event.keyCode == 13) //enter
                {
                    game.typing=false;
                    if(game.typingSide=='message')
                    {
                        game.sendMessage();
                    }


                } else if(game.input.keyboard.event.keyCode == 27) //escape
                {
                    
                    if(game.typingSide=='message')
                    {
                        game.typing=false;
                        game.cancelMessage();
                    }
                } else if(game.input.keyboard.event.keyCode > 47 && game.input.keyboard.event.keyCode < 57) //?
                {
                    var symbols = [')','!','@','#','$','%','^','&','*','(']
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += symbols[game.input.keyboard.event.keyCode-48]  
                        } else
                        {
                            game.typedText += (game.input.keyboard.event.keyCode-48).toString();
                        } 

                } else if(game.input.keyboard.event.keyCode == 186) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += ':';   
                        } else
                        {
                            game.typedText += ';';
                        } 

                } else if(game.input.keyboard.event.keyCode == 187) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '+';   
                        } else
                        {
                            game.typedText += '=';
                        } 

                } else if(game.input.keyboard.event.keyCode == 188) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '<';   
                        } else
                        {
                            game.typedText += ',';
                        } 

                } else if(game.input.keyboard.event.keyCode == 189) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '_';   
                        } else
                        {
                            game.typedText += '-';
                        } 

                } else if(game.input.keyboard.event.keyCode == 190) //?
                {
                    if(game.typedText.length < maxTagLength)
                    {
                        if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '>';   
                        } else
                        {
                            game.typedText += '.';
                        }
                    }  

                } else if(game.input.keyboard.event.keyCode == 191) //?
                {
                    if(game.typedText.length < maxTagLength)
                    {
                        if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '?';   
                        } else
                        {
                            game.typedText += '/';
                        }
                    }  

                } else if(game.input.keyboard.event.keyCode == 219) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '{';   
                        } else
                        {
                            game.typedText += '[';
                        } 

                } else if(game.input.keyboard.event.keyCode == 220) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '|';   
                        } else
                        {
                            game.typedText += '\\';
                        } 

                } else if(game.input.keyboard.event.keyCode == 221) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '}';   
                        } else
                        {
                            game.typedText += ']';
                        } 

                } else if(game.input.keyboard.event.keyCode == 222) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '"';   
                        } else
                        {
                            game.typedText += "'";
                        } 

                } else if(ignoreKeys.indexOf(game.input.keyboard.event.keyCode) > -1 )
                {
                    //do nothing
                } else
                {
                    if(game.typedText.length < maxTagLength)
                    {
                        if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += String.fromCharCode(game.input.keyboard.event.keyCode);     
                        } else
                        {
                            game.typedText += String.fromCharCode(game.input.keyboard.event.keyCode).toLowerCase();   
                        }
                        
                    }  
                }
                if(game.typingSide=='left')
                {
                    game.leftLabel.setText(game.typedText);
                    maxLabel(game.leftLabel);
                } else if(game.typingSide=='right')
                {
                    game.rightLabel.setText(game.typedText);
                    maxLabel(game.rightLabel);
                } else if(game.typingSide=='title')
                {
                    game.titleLabel.setText(game.typedText);
                    if(game.titleLabel.width>614)
                    {
                        console.log("shortening: " + game.titleLabel.text.substring(0, game.titleLabel.text.length - 1))
                        game.typedText = game.typedText.substring(0, game.typedText.length - 1)
                        game.titleLabel.setText(game.typedText);
                    }
                } else if(game.typingSide=='message')
                {
                    maxTagLength = 100;
                    game.messageLabel.setText(game.typedText);
                    if(game.messageLabel.width>720)
                    {
                        game.typedText = game.typedText.substring(0, game.typedText.length - 1)
                        game.messageLabel.setText(game.typedText);
                    }
                }
                
            }

        };
        
    }, 

    update : function(){
        if(typeof game.choiceSlider !== 'undefined' && game.choiceSlider.dragging==true)
        {
            if(game.input.x < 155)
            {
                game.choiceSlider.x=120;
                game.choiceSliderChosen = 3;
            } else if (game.input.x < 230)
            {
                game.choiceSlider.x=194;
                game.choiceSliderChosen = 4;
            } else if (game.input.x < 300)
            {
                game.choiceSlider.x=268;
                game.choiceSliderChosen = 5;
            } else
            {
                game.choiceSlider.x=340;
                game.choiceSliderChosen = 6;
            }
            game.choiceIndicator.setText(game.choiceSliderChosen.toString())
        }

    } 
};
game.state.add('DesignQuestion',States.DesignQuestion);

States.ShowAnswers = function(){ }; 
States.ShowAnswers.prototype = { 
    preload : function(){ 
    // load basic assets for this state 
    this.load.image('blankBack','assets/blankBack.png'); 
    this.load.image('newQuestion','assets/newQuestion.png');
    this.load.image('answerBack','assets/answerBack.png');
    this.load.image('answerBackGreen','assets/answerBackGreen.png');
    this.load.image('answerBackYellow','assets/answerBackYellow.png');
    this.load.image('answerBackRed','assets/answerBackRed.png');
    this.load.image('messageButton','assets/messageButton.png');
    //this.load.image('name','assets/name.jpg'); 
    
    }, 

    create : function(){ 
        this.blankBack = this.add.sprite(0,0,'blankBack');
        
        game.detailPane = game.add.sprite(25, 15,'answerBack' );
        game.detailPane.scale.setTo(6.1,1.3);

            
        var newQuestionButton = game.add.sprite(600, 20,'newQuestion' );
        newQuestionButton.inputEnabled='true'
        newQuestionButton.events.onInputDown.add(newQuestion);
        newQuestionButton.input.useHandCursor = true;
        
        
        function newQuestion()
        {
            game.fillingSpot = 0;
            game.state.start('PickQuestionType');
        }
        game.backSprites = []
        var row = 0;
        var column = 0;
        game.fillingSpot = 0;
            
        for(var i = 0 ; i < 36 ; i++)
        {
            var backSprite = game.add.sprite(row*200+10, column*50+150,'answerBack' );
            backSprite.inputEnabled='true'
            backSprite.events.onInputDown.add(showDetail, this);
            backSprite.input.useHandCursor = true;
            backSprite.scale.setTo(2,0.5);
            backSprite.spot = i;
            game.backSprites.push(backSprite);
            row++
            if(row > 3)
            {
                row = 0;
                column++;
            }
        }
        
        game.detailGroup = game.add.group();
        function showDetail(backSprite)
        {
            console.log("showing detail for student #" + backSprite.spot)
            
            game.detailPane.loadTexture('answerBack');
            game.detailGroup.destroy();
            game.detailGroup = game.add.group();
            
            if(game.backSprites[backSprite.spot].name!='')
            {
                //student exists
                var messageButtonSprite = game.add.sprite(450, 100,'messageButton' );
                messageButtonSprite.inputEnabled='true'
                messageButtonSprite.events.onInputDown.add(messageStudent, this);
                messageButtonSprite.spot = backSprite.spot;
                messageButtonSprite.input.useHandCursor = true;
                game.detailGroup.add(messageButtonSprite)
            }
            
            var nameInfo = game.add.text(35,20, game.backSprites[backSprite.spot].name);
            nameInfo.anchor.setTo(0,0);
            nameInfo.font = 'Arial';
            nameInfo.fontSize = 24;
            nameInfo.fill = '#FFFFFF';
            game.detailGroup.add(nameInfo)

            var answerInfo = game.add.text(35,50, game.backSprites[backSprite.spot].answer);
            answerInfo.anchor.setTo(0,0);
            answerInfo.font = 'Arial';
            answerInfo.fontSize = 24;
            answerInfo.fill = '#FFFFFF';
            game.detailGroup.add(answerInfo)
            shrinkAnswer(answerInfo);
            
            function shrinkAnswer(textSprite)
            {
                console.log(textSprite.width)
                if(textSprite.width > 535)
                {
                    textSprite.fontSize--;
                    shrinkAnswer(textSprite);
                }
            }
            
            var commentInfo = game.add.text(35,80, game.backSprites[backSprite.spot].comment);
            commentInfo.anchor.setTo(0,0);
            commentInfo.font = 'Arial';
            commentInfo.fontSize = 24;
            commentInfo.fill = '#FFFFFF';
            commentInfo.wordWrap =  true;
            commentInfo.wordWrapWidth = 410; 
            game.detailGroup.add(commentInfo)
            resizeComment(commentInfo)
            
            game.messagePanel = game.add.group()
            function messageStudent(detail)
            {
                console.log("sending message to student: " + detail.spot)
                game.backSprites.forEach(function(item){
                    item.inputEnabled=false
                });
                newQuestionButton.inputEnabled=false
                messageButtonSprite.inputEnabled=false
                
                game.messagePanel.destroy
                game.messagePanel = game.add.group()
                //build panel
                var boxGraphic = game.add.graphics(25, 300);
                boxGraphic.beginFill(0x555555);
                boxGraphic.lineStyle(0, 0x000000, 1);
                boxGraphic.drawRect(0, 0, 750, 50);
                boxGraphic.endFill();
                game.messagePanel.add(boxGraphic)
                
                //add a game.messageLabel
                game.messageLabel = game.add.text(40,330,'')
                game.messageLabel.anchor.setTo(0,0.5);
                game.messageLabel.font = 'Arial';
                game.messageLabel.fontSize = 24;
                game.messageLabel.fill = '#FFFFFF';
                game.messageLabel.align = 'center';
                game.messagePanel.add(game.messageLabel)
                game.world.bringToTop(game.messagePanel);
                
                game.typedText = '';
                game.typingSide='message';
                game.typing=true;
                game.typedText = '';

                game.cancelMessage = function()
                {
                    game.messagePanel.destroy();
                    game.backSprites.forEach(function(item){
                        item.inputEnabled=true
                        item.input.useHandCursor = true;
                    });
                    newQuestionButton.inputEnabled=true
                    newQuestionButton.input.useHandCursor = true;
                    messageButtonSprite.inputEnabled=true;
                    messageButtonSprite.input.useHandCursor = true;
                }
                
                game.sendMessage = function()
                {
                    
                    if(game.messageLabel.text.length>0)
                    {
                        var ref = new Firebase("https://maestroclass.firebaseio.com/classtags/"+game.classtag);
                        var answersRef = ref.child("messages");
                        answersRef.push().set({
                            uid: game.backSprites[detail.spot].uid ,
                            message: game.messageLabel.text
                        });   
                    }
                    game.messagePanel.destroy();
                    game.backSprites.forEach(function(item){
                        item.inputEnabled=true
                        item.input.useHandCursor = true;
                    });
                    newQuestionButton.inputEnabled=true
                    newQuestionButton.input.useHandCursor = true;
                    messageButtonSprite.inputEnabled=true;
                    messageButtonSprite.input.useHandCursor = true;
                }

                
    
            
            }
            
           
            
            function resizeComment(comment)
            {
                if(comment.height>55)
                {
                    console.log(comment.height)
                    commentInfo.fontSize--;
                    resizeComment(comment)
                } else
                {
                    console.log("final height: " + comment.height)
                }
            }

            switch(game.backSprites[backSprite.spot].difficulty) {
            case 'm':
                game.detailPane.loadTexture('answerBackYellow');  //yellow
                nameInfo.fill = '#000000';
                answerInfo.fill = '#000000';
                commentInfo.fill = '#000000';
                break;
            case 'e':
                game.detailPane.loadTexture('answerBackGreen');  //green
                break;
            case 'h':
                game.detailPane.loadTexture('answerBackRed');   //red
                break;
            }
        }
        
        // Get a reference to our posts
        var ref = new Firebase("https://maestroclass.firebaseio.com/classtags/"+game.classtag+"/answers");
        
        // Retrieve new posts as they are added to our database
        if(game.loggingAnswers != true)
        {
           game.loggingAnswers = true;
           console.log("starting an answer stream...")
           ref.on("child_added", function(snapshot, prevChildKey) {
            console.log(snapshot.val())
            console.log(snapshot.key())
            console.log(prevChildKey)
            console.log(snapshot.val())   
            console.log("Difficulty: " + snapshot.val().difficulty);
            console.log("Name: " + snapshot.val().name);
            console.log("Answer: " + snapshot.val().answer);
            console.log(game.backSprites[game.fillingSpot])
            game.backSprites[game.fillingSpot].difficulty = snapshot.val().difficulty;
            game.backSprites[game.fillingSpot].name = snapshot.val().name;
            game.backSprites[game.fillingSpot].answer = snapshot.val().answer;
            game.backSprites[game.fillingSpot].uid = snapshot.val().uid;
            game.backSprites[game.fillingSpot].comment = snapshot.val().comment;
            
            var nameInfo = game.add.text(game.backSprites[game.fillingSpot].x+2,game.backSprites[game.fillingSpot].y+2, snapshot.val().name);
            nameInfo.anchor.setTo(0,0);
            nameInfo.font = 'Arial';
            nameInfo.fontSize = 12;
            nameInfo.fill = '#FFFFFF';
            shortenText(nameInfo)
            
            var answerInfo = game.add.text(game.backSprites[game.fillingSpot].x+2,game.backSprites[game.fillingSpot].y+15, snapshot.val().answer);
            answerInfo.anchor.setTo(0,0);
            answerInfo.font = 'Arial';
            answerInfo.fontSize = 12;
            answerInfo.fill = '#FFFFFF';
            shortenText(answerInfo)
            
            var commentInfo = game.add.text(game.backSprites[game.fillingSpot].x+2,game.backSprites[game.fillingSpot].y+28, snapshot.val().comment);
            commentInfo.anchor.setTo(0,0);
            commentInfo.font = 'Arial';
            commentInfo.fontSize = 12;
            commentInfo.fill = '#FFFFFF';
            shortenText(commentInfo)
            
            

            switch(snapshot.val().difficulty) {
            case 'm':
                game.backSprites[game.fillingSpot].loadTexture('answerBackYellow');  //yellow
                nameInfo.fill = '#000000';
                answerInfo.fill = '#000000';
                commentInfo.fill = '#000000';
                console.log(answerInfo.fill)
                break;
            case 'e':
                game.backSprites[game.fillingSpot].loadTexture('answerBackGreen');  //green
                break;
            case 'h':
                game.backSprites[game.fillingSpot].loadTexture('answerBackRed');   //red
                break;
            }

            //backSprites[game.fillingSpot].loadTexture(backGraphic.generateTexture())

            
            game.fillingSpot++;
            
            function shortenText(textSprite)
            {
                console.log('width: '+ textSprite.width)
                if(textSprite.width>175)
                {
                    textSprite.setText(textSprite.text.substring(0, textSprite.text.length - 1));
                    shortenText(textSprite);
                }
            }

                
              
            });
        }
        

    // place the assets and elements in their initial positions, create the state 
    

    //this.titleName = this.add.sprite(300,300,'name'); 

    }, 

    update : function(){ 

    // your game loop goes here 

    //this.titleName.x++; 
    } 
};
game.state.add('ShowAnswers',States.ShowAnswers);

States.PollForQuestion = function(){ }; 
States.PollForQuestion.prototype = { 
    preload : function(){ 
    this.load.image('blankBack','assets/blankBack.png'); 
    
    }, 

    create : function(){ 
        this.blankBack = this.add.sprite(0,0,'blankBack');
        
        var pollingInfo = game.add.text(400,100, 'Waiting for a new question...' );
        pollingInfo.anchor.setTo(0.5,0.5);
        pollingInfo.font = 'Arial';
        pollingInfo.fontSize = 48;
        pollingInfo.fill = '#FFFFFF';
        
        if(!game.pollingForQuestions)
        {
            game.pollingForQuestions=true;
            var ref = new Firebase("https://maestroclass.firebaseio.com/classtags/"+game.classtag);
                ref.orderByChild("updateTime").on("child_changed", function(snapshot) {
                  console.log(snapshot.key());
                  console.log(snapshot.val());
                  console.log(game.lastUpdate)
                  if(snapshot.key()=="updateTime" && snapshot.val() != game.lastUpdate)
                  {
                        game.lastUpdate = snapshot.val();
                        game.state.start('ShowQuestion');
                  }
            });
        }
        
                
        // place the assets and elements in their initial positions, create the state 
    
        //this.titleName = this.add.sprite(300,300,'name'); 

    }, 

    update : function(){ 

    // your game loop goes here 

    //this.titleName.x++; 
    } 
};
game.state.add('PollForQuestion',States.PollForQuestion);


States.ShowQuestion = function(){ }; 
States.ShowQuestion.prototype = { 
    preload : function(){ 
    // load basic assets for this state 
    
    this.load.image('blankBack','assets/blankBack.png'); 
    this.load.image('broadCastButton','assets/broadCastButton.png'); 
    this.load.image('commentButton','assets/commentButton.png');
    this.load.image('difficultyScale','assets/difficultyScale.png'); 
    this.load.image('difficultySlider','assets/difficultySlider.png'); 
    this.load.image('questionScale','assets/questionScale.png'); 
    this.load.image('questionSlider','assets/questionSlider.png'); 
    
    }, 

    create : function(){ 
        this.blankBack = this.add.sprite(0,0,'blankBack');
        var answered = false;
        game.answer = null;
        game.comment = ''
        // place the assets and elements in their initial positions, create the state 
        var ref = new Firebase("https://maestroclass.firebaseio.com/classtags/"+game.classtag);
        // Attach an asynchronous callback to read the data at our posts reference
        var drawnQuestion = false
        var questionButtons = [];
        ref.on("value", function(snapshot) {
            //triggering when other person answers
            if(!drawnQuestion)
            {
                drawnQuestion = true;
                console.log(snapshot.val());
                if(snapshot.val().intermission)
                {
                    game.state.start('PollForQuestion');
                }
                var fullName = snapshot.val().teacher.split(' ')
                var lastName = fullName[fullName.length - 1];
                var teacherLabel = game.add.text(400,40, "#" + game.classtag + " - " + lastName )
                teacherLabel.anchor.setTo(0.5,0.5);
                teacherLabel.font = 'Arial';
                teacherLabel.fontSize = 36;
                teacherLabel.fill = '#FFFFFF';
                
                var titleLabel = game.add.text(400,80, snapshot.val().titleLabel )
                titleLabel.anchor.setTo(0.5,0.5);
                titleLabel.font = 'Arial';
                titleLabel.fontSize = 24;
                titleLabel.fill = '#FFFFFF';
                
                var commentButton = game.add.sprite(675,570,'commentButton')
                commentButton.inputEnabled='true'
                commentButton.scale.setTo(0.7,0.7)
                commentButton.events.onInputDown.add(typeComment);
                commentButton.input.useHandCursor = true;
                questionButtons.push(commentButton);
                
                var broadCastButton = game.add.sprite(400,525,'broadCastButton')
                broadCastButton.anchor.setTo(0.5,0.5);
                broadCastButton.inputEnabled='true'
                broadCastButton.events.onInputDown.add(broadCastAnswer);
                broadCastButton.input.useHandCursor = true;
                questionButtons.push(broadCastButton);
                
                game.difficultyScale = game.add.sprite(70,560,'difficultyScale')
                game.difficultyScale.anchor.setTo(0.5,0.5);
                
                game.difficultySlider = game.add.sprite(70,575,'difficultySlider')
                game.difficultySlider.anchor.setTo(0.5,0.5);
                game.difficultySlider.inputEnabled='true'
                game.difficultySlider.events.onInputDown.add(dragDifficultySlider);
                game.difficultySlider.events.onInputUp.add(finishDragDifficultySlider);
                game.difficultySlider.dragging=false;
                game.difficultySlider.input.useHandCursor = true;
                game.difficultyChosen = 'm';
                questionButtons.push(game.difficultySlider);
                
                //build question here with a case statement
                switch(snapshot.val().questionType) {
                    case 'thisThat':
                        buildChoiceQuestion();
                        break;
                    case 'dragger':
                        buildDraggerQuestion();
                        break;
                    case 'multi':
                        buildMultiQuestion();
                        break;
                    case 'typeIn':
                        buildTypeInQuestion();
                        break;
                }
                
            }
            
            game.messagePanel = game.add.group()
            function typeComment()
            {
                console.log("typing comment")
                questionButtons.forEach(function(item){
                    item.inputEnabled=false
                });
                game.messagePanel.destroy
                game.messagePanel = game.add.group()
                //build panel
                var boxGraphic = game.add.graphics(25, 300);
                boxGraphic.beginFill(0x555555);
                boxGraphic.lineStyle(0, 0x000000, 1);
                boxGraphic.drawRect(0, 0, 750, 50);
                boxGraphic.endFill();
                game.messagePanel.add(boxGraphic)
                
                //add a game.messageLabel
                game.messageLabel = game.add.text(40,330,'')
                game.messageLabel.anchor.setTo(0,0.5);
                game.messageLabel.font = 'Arial';
                game.messageLabel.fontSize = 24;
                game.messageLabel.fill = '#FFFFFF';
                game.messageLabel.align = 'center';
                game.messagePanel.add(game.messageLabel)
                game.world.bringToTop(game.messagePanel);
                
                game.typedText = '';
                game.typingSide='comment';
                game.typing=true;
                game.typedText = '';

                game.cancelComment = function()
                {
                    questionButtons.forEach(function(item){
                        item.inputEnabled=true
                        item.input.useHandCursor = true;
                    });
                    game.messagePanel.destroy();
                }
                
                game.sendComment = function()
                {
                    questionButtons.forEach(function(item){
                        item.inputEnabled=true
                        item.input.useHandCursor = true;
                    });
                    game.comment = game.messageLabel.text;
                    game.messagePanel.destroy();
                }
            }
            
            function dragDifficultySlider()
            {
                console.log("dragging")
                game.difficultySlider.dragging=true;
            }
            
            function finishDragDifficultySlider()
            {
                console.log("done dragging")
                game.difficultySlider.dragging=false;
            }
            
            function buildTypeInQuestion()
            {
                console.log("building type-in question")
                var typeBoxGraphic = game.add.graphics(0, 0);
                typeBoxGraphic.beginFill(0x000055);  //dark blue
                typeBoxGraphic.lineStyle(0, 0x000000, 1);
                typeBoxGraphic.drawRect(0, 0, 750, 50);
                typeBoxGraphic.endFill();
                
                var typeBox = game.add.sprite(400,250,typeBoxGraphic.generateTexture())
                typeBoxGraphic.destroy();
                typeBox.alpha = 0.5
                typeBox.anchor.setTo(0.5,0.5)
                typeBox.inputEnabled='true'
                typeBox.events.onInputDown.add(resetAnswer, this);
                typeBox.input.useHandCursor = true;
                
                game.typedAnswer = game.add.text(typeBox.x, typeBox.y, "Click here to enter your answer...")
                game.typedAnswer.anchor.setTo(0.5,0.5);
                game.typedAnswer.font = 'Arial';
                game.typedAnswer.fontSize = 24;
                game.typedAnswer.fill = '#FFFFFF';
                game.typedAnswer.align = 'center'; 
                
                function resetAnswer()
                {
                    if(game.typing)
                    {
                        game.sendComment();
                    }
                    game.typedText = '';
                    game.answer = null;
                    game.typedAnswer.setText('');
                    game.typing = true;
                    game.typingSide = 'answer'
                }
        
            }
            function buildMultiQuestion()
            {
                var choiceBackGraphic = game.add.graphics(100, 200);
                choiceBackGraphic.beginFill(0x333333);  //gray
                choiceBackGraphic.lineStyle(0, 0x000000, 1);
                choiceBackGraphic.drawRect(0, 0, 100, 100);
                choiceBackGraphic.endFill();
                var choiceAnswers = new Array(snapshot.val().choices);
                var choiceLetters = ['A','B','C','D','E','F'];
                var choices = [];
                var margin = 465-snapshot.val().choices*60
                for(var i = 0; i < snapshot.val().choices ; i++)
                {
                    choices.push(game.add.sprite(margin+i*120 , 300 , choiceBackGraphic.generateTexture()))
                    choices[i].anchor.setTo(0.5,0.5);
                    choices[i].alpha=0.5;
                    choices[i].choice = choiceLetters[i];
                    choices[i].inputEnabled='true'
                    choices[i].events.onInputDown.add(highlightChoice, this);
                    choices[i].input.useHandCursor = true;
                    choices[i].highlight = game.add.graphics(choices[i].x, choices[i].y);
                    choices[i].selected = false;
                    choices[i].slot = i;
                    choiceAnswers[i] = "";
                    questionButtons.push(choices[i]);
                    
                    choices[i].letter = game.add.text(choices[i].x , choices[i].y , choiceLetters[i])
                    choices[i].letter.anchor.setTo(0.5,0.5);
                    choices[i].letter.font = 'Arial';
                    choices[i].letter.fontSize = 64;
                    choices[i].letter.fill = '#FFFFFF';
                }
                
                choiceBackGraphic.destroy();
                
                function highlightChoice(choice)
                {
                    
                    
                    if(snapshot.val().multiType == 'choice')
                    {
                        choices.forEach(function(item){
                            item.highlight.destroy();
                            choiceAnswers[item.slot] = "";
                            item.selected = false;
                        });
                    } else
                    {
                        choice.highlight.destroy();
                    }
                    
                    if(!choices[choice.slot].selected)
                    {
                        choice.highlight = game.add.graphics(choice.x, choice.y);
                        choice.highlight.lineStyle(4, 0x0000FF, 1);
                        choice.highlight.drawRect(-55, -55, 110, 110);  
                        choice.selected = true;
                        choiceAnswers[choice.slot] = choiceLetters[choice.slot];
                    } else
                    {
                        choiceAnswers[choice.slot] = "";
                        choice.selected = false;
                    }
                    
                    game.answer = '';
                    choiceAnswers.forEach(function(item){
                            game.answer += item;
                        });
                    
                }
                
            }
            
            function buildDraggerQuestion()
            {
                var questionScale = game.add.sprite(400,300,'questionScale');
                questionScale.anchor.setTo(0.5,0.5)
                
                game.questionSlider = game.add.sprite(70,300,'questionSlider');
                game.questionSlider.anchor.setTo(0.5,0.5)
                game.questionSlider.inputEnabled='true'
                game.questionSlider.events.onInputDown.add(dragQuestionSlider);
                game.questionSlider.events.onInputUp.add(finishDragQuestionSlider);
                game.questionSlider.dragging=false;
                game.questionSlider.input.useHandCursor = true;
                game.questionSliderSelected = 1;
                questionButtons.push(game.questionSlider);
                
                var leftLabel = game.add.text(65,360, snapshot.val().leftLabel )
                leftLabel.anchor.setTo(0,0.5);
                leftLabel.font = 'Arial';
                leftLabel.fontSize = 32;
                leftLabel.fill = '#00000';
                game.leftLabel = leftLabel;
                
                var rightLabel = game.add.text(735,360, snapshot.val().rightLabel )
                rightLabel.anchor.setTo(1,0.5);
                rightLabel.font = 'Arial';
                rightLabel.fontSize = 32;
                rightLabel.fill = '#00000';
                game.rightLabel = rightLabel;
                
                function dragQuestionSlider()
                {
                    console.log("dragging")
                    game.questionSlider.dragging=true;
                }
                
                function finishDragQuestionSlider()
                {
                    console.log("done dragging")
                    game.questionSlider.dragging=false;
                    game.answer = game.questionSliderSelected;
                }
                
            }
            
            function buildChoiceQuestion()
            {
                var leftBackGraphic = game.add.graphics(100, 200);
                leftBackGraphic.beginFill(0x333333);  //gray
                leftBackGraphic.lineStyle(0, 0x000000, 1);
                leftBackGraphic.drawRect(0, 0, 250, 200);
                leftBackGraphic.endFill();
                
                var leftButton = game.add.sprite(100,200,leftBackGraphic.generateTexture())
                leftBackGraphic.destroy();
                leftButton.alpha=0.3;
                leftButton.inputEnabled='true'
                leftButton.events.onInputDown.add(highlightLeft);
                leftButton.input.useHandCursor = true;
                questionButtons.push(leftButton);
                
                var leftLabel = game.add.text(225,300, snapshot.val().leftLabel )
                leftLabel.anchor.setTo(0.5,0.5);
                leftLabel.font = 'Arial';
                leftLabel.fontSize = 96;
                leftLabel.fill = '#FFFFFF';
                game.leftLabel = leftLabel;
                maxLabel(leftLabel);
                
                var rightBackGraphic = game.add.graphics(100, 200);
                rightBackGraphic.beginFill(0x333333);  //gray
                rightBackGraphic.lineStyle(0, 0x000000, 1);
                rightBackGraphic.drawRect(0, 0, 250, 200);
                rightBackGraphic.endFill();
                
                var rightButton = game.add.sprite(450,200,rightBackGraphic.generateTexture())
                rightBackGraphic.destroy();
                rightButton.alpha=0.3;
                rightButton.inputEnabled='true'
                rightButton.events.onInputDown.add(highlightRight);
                rightButton.input.useHandCursor = true;
                questionButtons.push(rightButton);
                
                var rightLabel = game.add.text(575,300, snapshot.val().rightLabel  )
                rightLabel.anchor.setTo(0.5,0.5);
                rightLabel.font = 'Arial';
                rightLabel.fontSize = 96;
                rightLabel.fill = '#FFFFFF';
                game.rightLabel = rightLabel;
                maxLabel(rightLabel);
            }
        
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
    
    var selectGraphic = game.add.graphics(100, 200);
    function highlightLeft()
    {
        console.log("left selected")
        console.log(selectGraphic)
        game.answer = game.leftLabel.text;
        answered = true;
        selectGraphic.destroy();
        selectGraphic = game.add.graphics(100, 200);
        selectGraphic.lineStyle(4, 0x0000FF, 1);
        selectGraphic.drawRect(0, 0, 250, 200);

    }
    
    function highlightRight()
    {
        console.log("right selected")
        game.answer = game.rightLabel.text;
        answered = true;
        selectGraphic.destroy();
        selectGraphic = game.add.graphics(450, 200);
        selectGraphic.lineStyle(4, 0x0000FF, 1);
        selectGraphic.drawRect(0, 0, 250, 200);
    }
    
    function broadCastAnswer()
    {
        if(game.answer != null )
        {
            console.log("broadcasting answer!")
            var fullName = game.user.google.displayName.split(' ')
            var firstName = fullName[0];
            var last = fullName[fullName.length - 1].charAt(0);
            fullName = firstName + " " + last + ".";
            var ref = new Firebase("https://maestroclass.firebaseio.com/classtags/"+game.classtag);
            var answersRef = ref.child("answers");
            answersRef.push().set({
                name: fullName,
                uid: game.user.uid,
                answer: game.answer,
                comment: game.comment,
                difficulty: game.difficultyChosen
            });
            game.state.start("PollForQuestion")    
        } else
        {
            console.log("no answer")
        }

    }
    //this.titleName = this.add.sprite(300,300,'name'); 
    function maxLabel(label)
        {
            if(label.width>0 && label.text.length>2)
            {
                
                label.fontSize =label.fontSize*240/label.width;
            } 
            
            if(label.fontSize > 110)
            {
                label.fontSize = 110;
            }
        }
    }, 

    update : function(){ 

    // your game loop goes here 

        if(game.difficultySlider.dragging==true)
        {
            if(game.input.x > 80)
            {
                game.difficultySlider.x=115;
                game.difficultyChosen = 'h';
            } else if (game.input.x < 60)
            {
                game.difficultySlider.x=25;
                game.difficultyChosen = 'e';
            } else
            {
                game.difficultySlider.x=70;
                game.difficultyChosen = 'm';
            }
        }
        if(typeof game.questionSlider !== 'undefined' && game.questionSlider.dragging==true)
        {
            if(game.input.x < 105)
            {
                game.questionSlider.x=70;
                game.questionSliderSelected = 1;
            } else if (game.input.x < 143+35)
            {
                game.questionSlider.x=143;
                game.questionSliderSelected = 2;
            } else if (game.input.x < 216+35)
            {
                game.questionSlider.x=216;
                game.questionSliderSelected = 3;
            }else if (game.input.x < 289+35)
            {
                game.questionSlider.x=289;
                game.questionSliderSelected = 4;
            }else if (game.input.x < 362+35)
            {
                game.questionSlider.x=362;
                game.questionSliderSelected = 5;
            }else if (game.input.x < 435+32)
            {
                game.questionSlider.x=435;
                game.questionSliderSelected = 6;
            }else if (game.input.x < 508+35)
            {
                game.questionSlider.x=508;
                game.questionSliderSelected = 7;
            }else if (game.input.x < 581+35)
            {
                game.questionSlider.x=581;
                game.questionSliderSelected = 8;
            }else if (game.input.x < 654+35)
            {
                game.questionSlider.x=654;
                game.questionSliderSelected = 9;
            } else
            {
                game.questionSlider.x=730;
                game.questionSliderSelected = 10;
            }
            
        }
        
        
    } 
};
game.state.add('ShowQuestion',States.ShowQuestion);

$(document).unbind('keydown').bind('keydown', function (event) {
    var doPrevent = false;
    if (event.keyCode === 8) {
        var d = event.srcElement || event.target;
        if ((d.tagName.toUpperCase() === 'INPUT' && 
             (
                 d.type.toUpperCase() === 'TEXT' ||
                 d.type.toUpperCase() === 'PASSWORD' || 
                 d.type.toUpperCase() === 'FILE' || 
                 d.type.toUpperCase() === 'SEARCH' || 
                 d.type.toUpperCase() === 'EMAIL' || 
                 d.type.toUpperCase() === 'NUMBER' || 
                 d.type.toUpperCase() === 'DATE' )
             ) || 
             d.tagName.toUpperCase() === 'TEXTAREA') {
            doPrevent = d.readOnly || d.disabled;
        }
        else {
            doPrevent = true;
        }
    }

    if (doPrevent) {
        event.preventDefault();
    }
});

function addStudentTyping()
{
    var ignoreKeys = [9,16,17,18,186,187,188,189,190,192,219,220,221,222]
        var maxTagLength = 30;
        game.input.keyboard.onDownCallback = function() {
            if(game.typing)
            {
                console.log(game.input.keyboard.event.keyCode)
                if(game.input.keyboard.event.keyCode == 8) //backspace
                {
                    game.typedText = game.typedText.substring(0, game.typedText.length - 1);
                } else if(game.input.keyboard.event.keyCode == 13) //enter
                {
                    game.typing=false;
                    if(game.typingSide=='comment')
                    {
                        game.sendComment();
                    }


                } else if(game.input.keyboard.event.keyCode == 27) //escape
                {
                    
                    if(game.typingSide=='comment')
                    {
                        game.typing=false;
                        game.cancelComment();
                    }


                } else if(game.input.keyboard.event.keyCode > 47 && game.input.keyboard.event.keyCode < 57) //?
                {
                    var symbols = [')','!','@','#','$','%','^','&','*','(']
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += symbols[game.input.keyboard.event.keyCode-48]  
                        } else
                        {
                            game.typedText += (game.input.keyboard.event.keyCode-48).toString();
                        } 

                } else if(game.input.keyboard.event.keyCode == 186) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += ':';   
                        } else
                        {
                            game.typedText += ';';
                        } 

                } else if(game.input.keyboard.event.keyCode == 187) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '+';   
                        } else
                        {
                            game.typedText += '=';
                        } 

                } else if(game.input.keyboard.event.keyCode == 188) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '<';   
                        } else
                        {
                            game.typedText += ',';
                        } 

                } else if(game.input.keyboard.event.keyCode == 189) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '_';   
                        } else
                        {
                            game.typedText += '-';
                        } 

                } else if(game.input.keyboard.event.keyCode == 190) //?
                {
                    if(game.typedText.length < maxTagLength)
                    {
                        if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '>';   
                        } else
                        {
                            game.typedText += '.';
                        }
                    }  

                } else if(game.input.keyboard.event.keyCode == 191) //?
                {
                    if(game.typedText.length < maxTagLength)
                    {
                        if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '?';   
                        } else
                        {
                            game.typedText += '/';
                        }
                    }  

                } else if(game.input.keyboard.event.keyCode == 219) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '{';   
                        } else
                        {
                            game.typedText += '[';
                        } 

                } else if(game.input.keyboard.event.keyCode == 220) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '|';   
                        } else
                        {
                            game.typedText += '\\';
                        } 

                } else if(game.input.keyboard.event.keyCode == 221) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '}';   
                        } else
                        {
                            game.typedText += ']';
                        } 

                } else if(game.input.keyboard.event.keyCode == 222) //?
                {
                    if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += '"';   
                        } else
                        {
                            game.typedText += "'";
                        } 

                } else if(ignoreKeys.indexOf(game.input.keyboard.event.keyCode) > -1 )
                {
                    //do nothing
                    console.log("ignoring keypress!")
                } else
                {
                    if(game.typedText.length < maxTagLength)
                    {
                        if(game.input.keyboard.isDown(Phaser.Keyboard.SHIFT))
                        {
                            game.typedText += String.fromCharCode(game.input.keyboard.event.keyCode);     
                        } else
                        {
                            game.typedText += String.fromCharCode(game.input.keyboard.event.keyCode).toLowerCase();   
                        }
                        
                    }  
                }
                console.log(game.typedText);
                if(game.typingSide=='comment')
                {
                    maxTagLength = 100;
                    game.messageLabel.setText(game.typedText);
                    if(game.messageLabel.width>720)
                    {
                        game.typedText = game.typedText.substring(0, game.typedText.length - 1)
                        game.messageLabel.setText(game.typedText);
                    }
                } else if(game.typingSide=='answer')
                {
                    maxTagLength = 100;
                    game.typedAnswer.setText(game.typedText);
                    if(game.typedAnswer.width>720)
                    {
                        game.typedText = game.typedText.substring(0, game.typedText.length - 1)
                        game.typedAnswer.setText(game.typedText);
                        
                    }
                    game.answer = game.typedAnswer.text;
                }
                
            }

        };
}
game.infoAlert = function(text)
{
    var alertBoxGraphic = game.add.graphics(0, 0);
    alertBoxGraphic.beginFill(0x555555);  //dark blue
    alertBoxGraphic.lineStyle(0, 0x000000, 1);
    alertBoxGraphic.drawRect(0, 0, 750, 50);
    alertBoxGraphic.endFill();
    var alertBox = game.add.sprite(400,550,alertBoxGraphic.generateTexture())
    alertBoxGraphic.destroy();
    alertBox.alpha = 0.8
    alertBox.anchor.setTo(0.5,0.5)
    var alertText = game.add.text(alertBox.x, alertBox.y, text)
    alertText.anchor.setTo(0.5,0.5);
    alertText.font = 'Arial';
    alertText.fontSize = 24;
    alertText.fill = '#FFFFFF';
    alertText.align = 'center';
    var alert = game.add.group();
    alert.add(alertBox)
    alert.add(alertText)
    game.time.events.add(Phaser.Timer.SECOND * 10, fadeOut, this);
    
    function fadeOut()
    {
        var tweenAlpha = game.add.tween(alert).to( { alpha:0 }, 800, Phaser.Easing.Cubic.Out, true);
        tweenAlpha.onComplete.add(deleteAlert);    
    }

    
    function deleteAlert()
    {
        alert.destroy();
    }

}