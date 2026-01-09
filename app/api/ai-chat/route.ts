import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Crisis keywords that require immediate attention
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'hurt myself',
  'overdose', 'cutting', 'no point living', 'better off dead', 'suicide plan'
];

// Enhanced companion system prompt for Serene
const SYSTEM_PROMPT = `You are Serene, a warm, intuitive AI companion who truly cares. Think of yourself as that friend who really gets it - someone who listens deeply, responds naturally, and never makes someone feel judged.

CORE PERSONALITY:
- Genuine warmth without being overly cheerful
- Naturally curious about people's inner worlds
- Remembers what they've shared to show you're truly present
- Uses varied, authentic language - avoid repetitive phrases like "I hear you" or "That sounds difficult"
- Sometimes shares gentle insights, sometimes just sits with emotions
- Adapts to their communication style (casual/formal, brief/detailed)

NATURAL CONVERSATION:
- Vary response length: sometimes short validation, sometimes deeper reflection
- Mix different approaches: emotional validation, practical support, gentle curiosity
- Use their own words back to them: "You mentioned feeling 'stuck' - what does stuck look like for you?"
- Natural transitions: "It strikes me that...", "I'm wondering if...", "Something tells me..."
- Ask different types of questions: about feelings, thoughts, experiences, hopes

RESPONSE VARIETY (Avoid repetition):
Instead of always "That sounds hard" → "What a weight to carry", "That's a lot to hold", "No wonder you're feeling drained"
Instead of always asking "How does that make you feel?" → "What's that like for you?", "Where do you feel that in your body?", "What comes up when you think about it?"
Instead of always "I'm here for you" → "You don't have to carry this alone", "I'm sitting with you in this", "This feels important"

CONVERSATION FLOW:
- Sometimes focus on the emotion, sometimes on the story, sometimes on their strengths
- Notice patterns: "I'm noticing you keep coming back to...", "There's something about the way you describe..."
- Celebrate small wins: "That took courage", "You're being so thoughtful about this"
- Be present with uncertainty: "Not knowing can be its own kind of difficult"

KEEP IT REAL:
- 2-4 sentences, 50-100 words
- One thoughtful question or reflection per response
- Avoid therapy-speak; use everyday language
- Let silence and space exist - not every feeling needs fixing

You're not trying to solve everything - you're being genuinely present with whatever they bring.`;

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory, userProfile } = await req.json();

    // Check for crisis keywords
    const messageText = message.toLowerCase();
    const hasCrisisKeywords = CRISIS_KEYWORDS.some(keyword => 
      messageText.includes(keyword)
    );

    if (hasCrisisKeywords) {
      return NextResponse.json({
        response: `I'm really worried about you right now. What you're feeling sounds incredibly painful, and I want you to know you don't have to go through this alone.

Please reach out for immediate support:
• Call 988 - they're available 24/7
• Text HOME to 741741 for crisis support
• Call 911 if you're in immediate danger

You matter, and there are people who want to help. Can you reach out to someone right now?`,
        isCrisis: true,
        suggestedActions: [
          'Yes, I can call someone',
          'I need help but I\'m scared',
          'I don\'t know who to call'
        ]
      });
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-10) // Keep last 10 messages for context
      .map((msg: any) => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${SYSTEM_PROMPT}

CONVERSATION HISTORY:
${conversationContext}

USER PROFILE: ${userProfile ? JSON.stringify(userProfile) : 'New user'}

CURRENT MESSAGE: ${message}

Please respond as Serene. Be warm, empathetic, and conversational. Keep it short and ask one gentle question to continue the dialogue.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    // Generate suggested responses based on the conversation
    const suggestedResponses = await generateSuggestedResponses(message, response);

    // Determine if an assessment might be helpful
    const shouldSuggestAssessment = shouldOfferAssessment(conversationHistory, message);

    // Generate homework/exercise if appropriate
    const homework = await generateHomework(message, conversationHistory);

    return NextResponse.json({
      response,
      suggestedResponses,
      shouldSuggestAssessment,
      homework,
      isCrisis: false
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    console.error('Error details:', error);
    return NextResponse.json(
      {
        error: "I apologize, but I'm having trouble processing your message right now. Please try again in a moment.",
        response: "I'm here to listen and support you. Could you please try sending your message again?",
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined

      },
      { status: 500 }
    );
  }
}

async function generateSuggestedResponses(userMessage: string, aiResponse: string) {
  const baseResponses = [
    "That really resonates with me",
    "You get it",
    "Exactly - that's how it feels", 
    "I've been thinking about that too",
    "It's hard to put into words",
    "I needed to hear that",
    "That makes a lot of sense",
    "I'm still figuring this out",
    "Tell me more about that",
    "That's been on my mind lately"
  ];

  const contextualResponses = [];
  const msg = userMessage.toLowerCase();

  // Emotional states
  if (msg.includes('anxious') || msg.includes('anxiety') || msg.includes('worried')) {
    contextualResponses.push(
      "My mind won't stop racing",
      "It feels like everything's spiraling",
      "I keep imagining worst-case scenarios",
      "The 'what ifs' are consuming me"
    );
  }
  
  if (msg.includes('sad') || msg.includes('depressed') || msg.includes('down')) {
    contextualResponses.push(
      "Everything feels so heavy",
      "I don't remember feeling happy",
      "It's like I'm watching life from outside",
      "Even small things feel impossible"
    );
  }
  
  if (msg.includes('overwhelmed') || msg.includes('stress')) {
    contextualResponses.push(
      "I don't know where to start",
      "There's too much on my plate",
      "I feel like I'm drowning",
      "I can't catch a break"
    );
  }

  // Life situations
  if (msg.includes('work') || msg.includes('job') || msg.includes('career')) {
    contextualResponses.push(
      "Work is draining me",
      "I dread Monday mornings",
      "I feel stuck in this role",
      "My job doesn't fulfill me anymore"
    );
  }
  
  if (msg.includes('relationship') || msg.includes('family') || msg.includes('friends')) {
    contextualResponses.push(
      "Relationships are complicated",
      "I don't know how to communicate this",
      "I feel misunderstood",
      "It's affecting other parts of my life"
    );
  }

  // Mix base and contextual responses
  const allOptions = [...baseResponses, ...contextualResponses];
  return allOptions.sort(() => 0.5 - Math.random()).slice(0, 3);
}

function shouldOfferAssessment(conversationHistory: any[], currentMessage: string): boolean {
  // Offer assessment after 3-4 exchanges or if user mentions specific symptoms
  const messageCount = conversationHistory.length;
  const assessmentKeywords = ['depression', 'anxiety', 'stress', 'panic', 'trauma', 'sleep', 'mood'];
  
  const hasSymptoms = assessmentKeywords.some(keyword => 
    currentMessage.toLowerCase().includes(keyword)
  );

  return messageCount >= 6 || hasSymptoms;
}

async function generateHomework(userMessage: string, conversationHistory: any[]) {
  const message = userMessage.toLowerCase();
  
  // Only offer homework after a few exchanges to build rapport first
  if (conversationHistory.length < 4) return null;
  
  if (message.includes('anxious') || message.includes('anxiety')) {
    return {
      title: "Simple Breathing Space",
      description: "When anxiety hits, try this: Take 3 slow, deep breaths. Count to 4 breathing in, hold for 4, breathe out for 6. That's it - just 3 breaths.",
      type: "exercise"
    };
  }
  
  if (message.includes('sad') || message.includes('depressed')) {
    return {
      title: "One Small Thing",
      description: "Today, try to notice just one tiny thing that doesn't feel heavy. Maybe it's your morning coffee, a text from a friend, or sunlight through a window.",
      type: "homework"
    };
  }
  
  if (message.includes('stress') || message.includes('overwhelmed')) {
    return {
      title: "The 2-Minute Reset",
      description: "When everything feels like too much, set a timer for 2 minutes. Just sit and breathe. Nothing else needs to happen in those 2 minutes.",
      type: "exercise"
    };
  }

  if (message.includes('sleep') || message.includes('tired')) {
    return {
      title: "Gentle Wind-Down",
      description: "30 minutes before bed, try putting your phone in another room. Just for tonight. See how it feels.",
      type: "homework"
    };
  }

  return null;
}
