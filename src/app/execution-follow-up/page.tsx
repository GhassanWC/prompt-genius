"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw,
  Send,
  User,
  Bot,
  Wrench,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PageAccessGuard } from "@/components/page-access-guard";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ExecutionFollowUpResult {
  gapAnalysis: string;
  correctivePrompt: string;
  keyIssues: string[];
  recommendations: string;
}

type MessageRole = "user" | "agent";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  data?: ExecutionFollowUpResult;
}

export default function ExecutionFollowUpPage() {
  const { user, loading: authLoading, subscriptionPlan } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [actualOutput, setActualOutput] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [aiTool, setAiTool] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"originalPrompt" | "actualOutput" | "desiredOutcome" | "aiTool" | "complete">("originalPrompt");
  const [typingMessages, setTypingMessages] = useState<Record<string, string>>({});
  const [lastResultMessageId, setLastResultMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingMessages]);

  // Typing effect for agent messages
  useEffect(() => {
    const newAgentMessages = messages.filter(
      (message) => message.role === "agent" && !typingMessages[message.id] && message.content
    );

    newAgentMessages.forEach((message) => {
      const fullText = message.content;
      let currentIndex = 0;
      const typingSpeed = 15; // milliseconds per character

      const typeInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypingMessages((prev) => ({
            ...prev,
            [message.id]: fullText.slice(0, currentIndex),
          }));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, typingSpeed);
    });
  }, [messages]);

  useEffect(() => {
    // Add welcome message from agent
    if (messages.length === 0 && !authLoading && user) {
      setMessages([{
        id: "welcome",
        role: "agent",
        content: "Hello! I'm the Execution Follow-Up Agent. I help repair prompts when AI tools don't follow instructions in software development contexts.\n\n⚠️ **Important**: I only work with software development prompts (coding, programming, web development, app development, etc.). I cannot help with general topics, creative writing, or non-technical content.\n\nTo get started, please provide:\n1. The original prompt you gave to the AI (must be software development related)\n2. What the AI actually did or produced\n\nYou can also optionally provide:\n- Your desired outcome (if not clear from the original prompt)\n- The AI tool you used (e.g., Cursor, ChatGPT, Gemini, Copilot)\n\nLet's begin! What was your original software development prompt?",
        timestamp: new Date(),
      }]);
    }
  }, [messages.length, authLoading, user]);

  const isSoftwareDevelopmentRelated = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const softwareKeywords = [
      'code', 'coding', 'programming', 'developer', 'development', 'software', 'application', 'app',
      'function', 'functionality', 'component', 'api', 'database', 'backend', 'frontend', 'fullstack',
      'html', 'css', 'javascript', 'typescript', 'python', 'java', 'react', 'vue', 'angular', 'node',
      'framework', 'library', 'package', 'module', 'class', 'interface', 'method', 'variable',
      'algorithm', 'data structure', 'git', 'repository', 'deploy', 'build', 'compile',
      'bug', 'error', 'debug', 'test', 'testing', 'unit test', 'integration', 'ci/cd',
      'server', 'client', 'endpoint', 'route', 'controller', 'model', 'view', 'mvc',
      'ui', 'ux', 'user interface', 'user experience', 'design system', 'component library',
      'prompt', 'ai tool', 'cursor', 'chatgpt', 'gemini', 'copilot', 'claude',
      'create a', 'build a', 'develop', 'implement', 'write code', 'generate code'
    ];
    
    return softwareKeywords.some(keyword => lowerText.includes(keyword));
  };

  const handleSendMessage = async (content: string, field?: string) => {
    if (!content.trim() || !user) return;

    const lowerContent = content.trim().toLowerCase();

    // Check for reserved words: "new prompt" or "another prompt" - reset conversation
    if (lowerContent.includes("new prompt") || lowerContent.includes("another prompt") || lowerContent === "new" || lowerContent === "another") {
      // Reset all state
      setOriginalPrompt("");
      setActualOutput("");
      setDesiredOutcome("");
      setAiTool("");
      setInputMode("originalPrompt");
      setLastResultMessageId(null);
      setError(null);
      
      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      
      // Add welcome message (same as initial welcome)
      const welcomeMessage: Message = {
        id: `agent-welcome-${Date.now()}`,
        role: "agent",
        content: "Hello! I'm the Execution Follow-Up Agent. I help repair prompts when AI tools don't follow instructions in software development contexts.\n\n⚠️ **Important**: I only work with software development prompts (coding, programming, web development, app development, etc.). I cannot help with general topics, creative writing, or non-technical content.\n\nTo get started, please provide:\n1. The original prompt you gave to the AI (must be software development related)\n2. What the AI actually did or produced\n\nYou can also optionally provide:\n- Your desired outcome (if not clear from the original prompt)\n- The AI tool you used (e.g., Cursor, ChatGPT, Gemini, Copilot)\n\nLet's begin! What was your original software development prompt?",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage, welcomeMessage]);
      return;
    }

    // Validate that the content is software development related (only for original prompt)
    if ((field === "originalPrompt" || inputMode === "originalPrompt") && !isSoftwareDevelopmentRelated(content.trim())) {
      const warningMessage: Message = {
        id: `agent-warning-${Date.now()}`,
        role: "agent",
        content: "I'm sorry, but I can only help with software development prompts. Your input doesn't appear to be related to coding, programming, or software development.\n\nPlease provide a prompt about:\n• Writing code or functions\n• Building applications or websites\n• Working with frameworks, libraries, or APIs\n• Debugging or fixing code issues\n• Software architecture or design patterns\n• Or any other software development task\n\nWhat was your original software development prompt?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, warningMessage]);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Update form state based on input mode or field
    let currentOriginalPrompt = originalPrompt;
    let currentActualOutput = actualOutput;
    let nextMode: typeof inputMode = inputMode;

    if (field === "originalPrompt" || inputMode === "originalPrompt") {
      currentOriginalPrompt = content.trim();
      setOriginalPrompt(content.trim());
      nextMode = "actualOutput";
      setInputMode("actualOutput");
    } else if (field === "actualOutput" || inputMode === "actualOutput") {
      currentActualOutput = content.trim();
      setActualOutput(content.trim());
      nextMode = "complete";
      setInputMode("complete");
    } else if (field === "desiredOutcome") {
      setDesiredOutcome(content.trim());
      nextMode = "aiTool";
      setInputMode("aiTool");
    } else if (field === "aiTool") {
      setAiTool(content.trim());
      nextMode = "complete";
      setInputMode("complete");
    } else if (inputMode === "complete") {
      // Check if user wants to analyze or provide more info
      const lowerContent = content.trim().toLowerCase();
      if (lowerContent.includes("analyze") || lowerContent === "go" || lowerContent === "proceed" || lowerContent === "yes" || lowerContent === "y") {
        // User wants to analyze
        await analyzeExecutionGap();
        return;
      } else if (lowerContent.includes("outcome") || lowerContent.includes("desired") || lowerContent.length > 50) {
        // Looks like desired outcome
        setDesiredOutcome(content.trim());
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "Got it! Any specific AI tool you used? (e.g., Cursor, ChatGPT, Gemini) Or just say 'analyze' to proceed.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
        return;
      } else if (lowerContent.length < 30 && !lowerContent.includes("no") && !lowerContent.includes("skip")) {
        // Short response, might be AI tool name
        setAiTool(content.trim());
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "Perfect! I have all the information I need. Should I proceed with the analysis? Just say 'analyze' to continue.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
        return;
      } else {
        // Treat as skip or proceed
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "I'll proceed with the analysis now.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
        await analyzeExecutionGap();
        return;
      }
    }

    // Check if user is responding to follow-up questions after results
    if (lastResultMessageId) {
      const lowerContent = content.trim().toLowerCase();
      
      // Check for regenerate request
      if (lowerContent.includes("regenerate") || lowerContent.includes("try again") || lowerContent.includes("redo") || lowerContent.includes("re-analyze")) {
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "I'll regenerate the analysis with a fresh approach. This may take a moment...",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
        await analyzeExecutionGap();
        return;
      }
      
      // Check for satisfaction/thanks
      if (lowerContent.includes("thanks") || lowerContent.includes("thank you") || lowerContent.includes("good") || lowerContent.includes("great") || lowerContent.includes("perfect") || lowerContent.includes("satisfied") || lowerContent.includes("done")) {
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "You're welcome! I'm glad I could help. If you have another prompt to analyze or need any adjustments, just let me know!",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
        return;
      }
    }

    // If we have both required fields, check if user wants to analyze
    if (currentOriginalPrompt && currentActualOutput && nextMode === "complete") {
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        role: "agent",
        content: "Perfect! I have both the original prompt and what the AI actually did. Would you like to provide any additional context (desired outcome or AI tool used), or should I proceed with the analysis? Just say 'analyze' to proceed.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
    } else {
      // Ask for next piece of information
      let nextPrompt = "";
      if (nextMode === "actualOutput") {
        nextPrompt = "Thank you! Now, what did the AI actually do or produce? Please paste the actual output or describe the behavior.";
      } else if (nextMode === "complete") {
        nextPrompt = "Got it! Would you like to provide any additional context?\n\n- Desired outcome (if not clear from the original prompt)\n- AI tool used (e.g., Cursor, ChatGPT, Gemini)\n\nOr just say 'analyze' to proceed with the analysis.";
      }
      
      if (nextPrompt) {
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: nextPrompt,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
      }
    }
  };

  const analyzeExecutionGap = async () => {
    const currentOriginalPrompt = originalPrompt.trim();
    const currentActualOutput = actualOutput.trim();
    
    if (!currentOriginalPrompt || !currentActualOutput || !user) {
      const agentMessage: Message = {
        id: `agent-error-${Date.now()}`,
        role: "agent",
        content: "I need both the original prompt and what the AI actually did to analyze the execution gap. Please provide both pieces of information.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      return;
    }

    // Validate that the original prompt is software development related
    if (!isSoftwareDevelopmentRelated(currentOriginalPrompt)) {
      const agentMessage: Message = {
        id: `agent-error-${Date.now()}`,
        role: "agent",
        content: "I can only analyze software development prompts. The original prompt you provided doesn't appear to be related to coding, programming, or software development.\n\nPlease provide a prompt about software development tasks such as:\n• Writing code or functions\n• Building applications or websites\n• Working with frameworks, libraries, or APIs\n• Debugging or fixing code issues\n• Software architecture or design patterns\n\nWould you like to provide a different software development prompt?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add loading message from agent
    const loadingMessage: Message = {
      id: `agent-loading-${Date.now()}`,
      role: "agent",
      content: "Analyzing the execution gap... This may take a moment.",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const token = await (await import("@/lib/firebase")).auth.currentUser?.getIdToken();

      const response = await fetch("/api/execution-follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          originalPrompt: currentOriginalPrompt,
          actualOutput: currentActualOutput,
          desiredOutcome: desiredOutcome.trim() || undefined,
          aiTool: aiTool.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze execution gap");
      }

      const data = await response.json();
      
      const resultMessageId = `agent-result-${Date.now()}`;
      setLastResultMessageId(resultMessageId);
      
      // Remove loading message and add result messages
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== loadingMessage.id);
        return [...filtered, {
          id: resultMessageId,
          role: "agent",
          content: "I've completed my analysis. Here are the findings:",
          timestamp: new Date(),
          data,
        }];
      });

      // Add follow-up question after a delay (to allow typing animation to complete)
      setTimeout(() => {
        const followUpMessage: Message = {
          id: `agent-followup-${Date.now()}`,
          role: "agent",
          content: "How would you like to proceed?\n\n• Say 'regenerate' or 'try again' if you'd like me to re-analyze with a different approach\n• Say 'new prompt' or 'another prompt' if you have a different prompt to analyze\n• Or let me know if you're satisfied with these results!",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, followUpMessage]);
      }, 2000); // Wait 2 seconds after results are shown
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== loadingMessage.id);
        return [...filtered, {
          id: `agent-error-${Date.now()}`,
          role: "agent",
          content: `I encountered an error: ${err.message || "An error occurred. Please try again."}`,
          timestamp: new Date(),
        }];
      });
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleReset = () => {
    setOriginalPrompt("");
    setActualOutput("");
    setDesiredOutcome("");
    setAiTool("");
    setError(null);
    setInputMode("originalPrompt");
    setMessages([{
      id: "welcome",
      role: "agent",
      content: "Hello! I'm the Execution Follow-Up Agent. I help repair prompts when AI tools don't follow instructions.\n\nTo get started, please provide:\n1. The original prompt you gave to the AI\n2. What the AI actually did or produced\n\nYou can also optionally provide:\n- Your desired outcome (if not clear from the original prompt)\n- The AI tool you used (e.g., Cursor, ChatGPT, Gemini, Copilot)\n\nLet's begin! What was your original prompt?",
      timestamp: new Date(),
    }]);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#00171f]">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f] dark:text-white" />
      </div>
    );
  }

  const getInputPlaceholder = () => {
    if (inputMode === "originalPrompt") return "Paste the original prompt you gave to the AI...";
    if (inputMode === "actualOutput") return "Paste what the AI actually produced or how it behaved...";
    if (inputMode === "desiredOutcome") return "What you actually wanted to achieve (optional)...";
    if (inputMode === "aiTool") return "e.g., Cursor, ChatGPT, Gemini, Copilot... (optional)";
    return "Type your message...";
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set height based on scrollHeight, with min and max constraints
    const minHeight = 60;
    const maxHeight = 200;
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
    // Show scrollbar if content exceeds max height
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustTextareaHeight(e.target);
  };

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Adjust height after paste event
    setTimeout(() => {
      if (textareaRef.current) {
        adjustTextareaHeight(textareaRef.current);
      }
    }, 0);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const input = form.querySelector("textarea") as HTMLTextAreaElement;
    if (input && input.value.trim()) {
      const field = inputMode === "originalPrompt" ? "originalPrompt" 
        : inputMode === "actualOutput" ? "actualOutput"
        : inputMode === "desiredOutcome" ? "desiredOutcome"
        : inputMode === "aiTool" ? "aiTool"
        : undefined;
      const content = input.value.trim();
      input.value = "";
      // Reset textarea height after clearing
      if (textareaRef.current) {
        textareaRef.current.style.height = "60px";
        textareaRef.current.style.overflowY = "hidden";
      }
      handleSendMessage(content, field);
    }
  };

  return (
    <PageAccessGuard>
      <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white relative overflow-x-hidden flex flex-col">
        {/* Subtle geometric background pattern */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] dark:opacity-[0.05]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#00171f]/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-0 font-bold group">
              <Image
                src="/logo.png"
                alt="Prompt Genius Logo"
                width={60}
                height={60}
                className="ml-1 mr-1"
              />
              <h1 className="font-headline text-xl text-[#00171f] dark:text-white tracking-tight hidden sm:block">
                Prompt Genius AI
              </h1>
            </Link>
            <div className="flex items-center gap-6">
              {messages.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Chat
                </Button>
              )}
              <UserNav />
            </div>
        </div>
      </header>

        {/* Chat Container */}
        <main className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "agent" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00171f]/10 dark:bg-white/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[#00171f] dark:text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-gray-100 dark:bg-gray-800 text-[#00171f] dark:text-white border border-gray-200 dark:border-gray-700"
                      : "bg-transparent text-[#00171f] dark:text-white"
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.role === "agent" && typingMessages[message.id] !== undefined
                      ? (
                        <>
                          {typingMessages[message.id]}
                          {typingMessages[message.id]?.length < message.content.length && (
                            <span className="inline-block w-2 h-4 bg-[#00171f] dark:bg-white ml-1 animate-pulse" />
                          )}
                        </>
                      )
                      : message.content}
                  </div>
                  
                  {/* Display result data if available - only show after typing is complete */}
                  {message.data && (typingMessages[message.id] === undefined || typingMessages[message.id]?.length >= message.content.length) && (
                    <div className="mt-4 space-y-4">
                      {/* Key Issues */}
                      {message.data.keyIssues && message.data.keyIssues.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                            <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Key Issues Identified</h3>
                          </div>
                          <ul className="space-y-1.5">
                            {message.data.keyIssues.map((issue, index) => (
                              <li key={index} className="flex items-start gap-2 text-amber-800 dark:text-amber-300 text-sm">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400 flex-shrink-0" />
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Corrective Prompt */}
                      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400" />
                            <h3 className="font-semibold text-green-900 dark:text-green-200 text-sm">Corrective Prompt</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(message.data!.correctivePrompt, "Corrective prompt")}
                            className="h-7 px-2 text-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/50"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="bg-white dark:bg-[#00171f] rounded-lg border border-green-200 dark:border-green-700 p-3 mt-2">
                          <pre className="whitespace-pre-wrap text-xs text-[#00171f] dark:text-white font-mono leading-relaxed">
                            {message.data.correctivePrompt}
                          </pre>
                        </div>
                      </div>

                      {/* Gap Analysis */}
                      <div className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                        <h3 className="font-semibold text-[#00171f] dark:text-white text-sm mb-2">Gap Analysis</h3>
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {message.data.gapAnalysis}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {message.data.recommendations && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-2">Recommendations</h3>
                          <div className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed whitespace-pre-wrap">
                            {message.data.recommendations}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <Avatar className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#00171f] dark:border-white">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="bg-[#00171f] dark:bg-white text-white dark:text-[#00171f]">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00171f]/10 dark:bg-white/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-[#00171f] dark:text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00171f] dark:text-white" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <form onSubmit={handleInputSubmit} className="relative">
              <div className="relative flex items-end">
                <Textarea
                  ref={textareaRef}
                  placeholder={getInputPlaceholder()}
                  className="flex-1 min-h-[60px] max-h-[200px] border-0 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-[#00171f] focus:ring-0 rounded-xl resize-none overflow-hidden transition-all pr-12 text-[#00171f] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleInputSubmit(e);
                    }
                  }}
                  onChange={handleTextareaChange}
                  onPaste={handleTextareaPaste}
                  disabled={isLoading}
                  style={{ height: "60px", paddingRight: "48px" }}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 bottom-2 bg-[#00171f] hover:bg-[#00171f]/90 text-white border-0 shadow-md font-semibold w-10 h-10 p-0 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </PageAccessGuard>
  );
}

