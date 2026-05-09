'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, Phone, MapPin, Send,
  Facebook, Twitter, Instagram,
  Loader2, CheckCircle2, Clock, Navigation,
} from 'lucide-react';

const contactInfo = [
  { icon: <Mail className="h-5 w-5" />, label: 'Email', value: 'houssambenomar17@gmail.com' },
  { icon: <Phone className="h-5 w-5" />, label: 'Phone', value: '+94 74 159 7471' },
  { icon: <MapPin className="h-5 w-5" />, label: 'Address', value: 'Casablanca' },
];

const socials = [
  { icon: <Instagram className="h-5 w-5" />, label: 'Instagram', href: 'https://www.instagram.com/elliot_alderson112?igsh=MTdsc21jaG90dWl5OA%3D%3D&utm_source=qr' },
  { icon: <Facebook className="h-5 w-5" />, label: 'Facebook', href: 'https://www.facebook.com/share/1JQCj2ChYT/?mibextid=wwXIfr' },
  { icon: <Twitter className="h-5 w-5" />, label: 'X', href: 'https://x.com/ho50539?s=21' },
];

const businessHours = [
  { day: 'Monday - Friday', hours: '8:00 AM - 8:00 PM' },
  { day: 'Saturday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Sunday', hours: 'Recovery support by email' },
];

type ContactApiResponse = {
  success?: boolean;
  error?: string;
  delivery?: 'direct';
};

export function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json() as ContactApiResponse;

      if (data.success) {
        setSubmitted(true);
        toast({
          title: data.delivery === 'direct' ? 'Message Ready' : 'Message Sent!',
          description: data.delivery === 'direct'
            ? 'Use the email on this page for the fastest reply.'
            : "We'll get back to you within 24 hours.",
        });
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Have a question, suggestion, or partnership opportunity? We&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div>
              <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
              <div className="space-y-4">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      {info.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{info.label}</p>
                      <p className="break-words text-sm font-medium">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Follow Us</h3>
              <div className="flex gap-3">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-2">Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 24 hours during business days. For urgent matters, please call us directly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  <Clock className="h-4 w-4 text-primary" />
                  Business Hours
                </h3>
                <div className="space-y-3">
                  {businessHours.map((item) => (
                    <div key={item.day} className="flex items-start justify-between gap-4 text-sm">
                      <span className="min-w-0 font-medium">{item.day}</span>
                      <span className="text-right text-muted-foreground">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Thanks for reaching out</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      We received your request. For urgent questions, email us directly at houssambenomar17@gmail.com.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl">
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="h-11 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="h-11 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="How can we help?"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your inquiry..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="min-h-[140px] rounded-xl resize-none"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl neon-glow gap-2 font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          className="mx-auto mt-10 max-w-5xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-0">
              <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black uppercase">
                    <Navigation className="h-4 w-4 text-primary" />
                    Visit Prime Forge
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Casablanca, Morocco - central training consultation area
                  </p>
                </div>
                <a
                  href="https://www.openstreetmap.org/search?query=Casablanca%2C%20Morocco"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                >
                  Open map
                </a>
              </div>
              <iframe
                title="Prime Forge location map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-7.733%2C33.472%2C-7.487%2C33.654&layer=mapnik&marker=33.5731%2C-7.5898"
                className="h-[340px] w-full border-0"
                loading="lazy"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
