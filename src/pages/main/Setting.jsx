import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { IconEye, IconEyeClosed, IconHierarchy3 } from "@tabler/icons-react";
import api from "@/lib/api";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import PermButton from "@/components/guard/PermButton";
import ExportDialog from "@/components/dialogs/ExportDialog";

export default function SettingsPage() {
  const [tracking, setTracking] = useState({
    gtmId: "",
    fbPixel: "",
    extraScripts: "",
  });
  const [whatsapp, setWhatsapp] = useState({
    enabled: false,
    number: "",
    message: "",
    position: "bottom-right",
  });
  const [smtp, setSmtp] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    encryption: "tls",
    fromName: "",
    fromEmail: "",
  });
  const [footerContact, setFooterContact] = useState({
    contact1: "",
    contact2: "",
    email: "",
    location: "",
    brief: "",
  });

  const [emailMessages, setEmailMessages] = useState({
    otp: { subject: "", body: "" },
    attachment: { subject: "", body: "" },
    status: { subject: "", body: "" },
    coupon_generic: { subject: "", body: "" },
  });

  const [razorpay, setRazorpay] = useState({
    keyId: "",
    keySecret: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [isSend, setIsSend] = useState(false);

  const [openExport, setOpenExport] = useState(false);

  const updateEmailMessages = async () => {
    try {
      await api().put("/api/emailMessages", emailMessages);
      toast.success("Email messages updated!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Fetch initial data
  useEffect(() => {
    (async () => {
      try {
        const res1 = await api().get("/api/settings");
        // console.log(res1.data);

        if (res1.data?.data) {
          setTracking(res1.data.data.tracking || {});
          setWhatsapp(res1.data.data.whatsapp || {});
          setFooterContact(res1.data.data.footerContact || {});
          setRazorpay(res1.data.data.razorpay || {});
        }
        const res2 = await api().get("/api/smtp-settings");
        if (res2.data) setSmtp(res2.data);

        const res4 = await api().get("/api/emailMessages");

        console.log("emailMessages", res4.data);
        if (res4.data)
          setEmailMessages((prev) => ({ ...prev, ...res4.data }));
      } catch (e) {
        toast.error(`${e.message}`);

        console.error("Failed to load settings", e);
      }
    })();
  }, []);

  const updateTracking = async () => {
    await api().put("/api/settings/global", { data: { tracking } });
    toast.success("Tracking settings updated!");
  };

  const updateWhatsapp = async () => {
    await api().put("/api/settings/global", { data: { whatsapp } });
    toast.success("WhatsApp settings updated!");
  };

  const updateSmtp = async () => {
    await api().put("/api/smtp-settings", smtp);
    toast.success("SMTP settings updated!");
  };

  const updateFooterContact = async () => {
    await api().put("/api/settings/global", { data: { footerContact } });
    toast.success("Footer contact settings updated!");
  };

  const updateRazorpay = async () => {
    await api().put("/api/settings/global", { data: { razorpay } });
    toast.success("Razorpay settings updated!");
  };

  const sendTestEmail = async () => {
    try {
      setIsSend(true);
      const response = await api().post("/api/smtp-settings/send-test-email", {
        email: testEmail,
        smtpSettings: smtp,
      });
      if (response.data.success) {
        toast.success("Test email sent successfully!");
        setTestModalOpen(false); // Close modal on success
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Failed to send test email.");
    } finally {
      setIsSend(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header
        title="Settings"
        right={
          <PermButton
            className="flex items-center gap-2 bg-gray-700 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
            onClick={() => setOpenExport(true)}
            model="settings"
            action="update"
          >
            <IconHierarchy3 className="h-4 w-4" />
            Export Data
          </PermButton>
        }
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tracking Card */}
          <Card className="border border-gray-200 dark:border-gray-900">
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input
                placeholder="Google Tag Manager ID"
                value={tracking.gtmId || ""}
                onChange={(e) =>
                  setTracking({ ...tracking, gtmId: e.target.value })
                }
              />
              <Input
                placeholder="Facebook Pixel ID"
                value={tracking.fbPixel || ""}
                onChange={(e) =>
                  setTracking({ ...tracking, fbPixel: e.target.value })
                }
              />
              <Textarea
                placeholder="Extra Scripts"
                className="w-full"
                value={tracking.extraScripts || ""}
                onChange={(e) =>
                  setTracking({ ...tracking, extraScripts: e.target.value })
                }
              />
            </CardContent>
            <CardFooter className={"w-full mt-auto"}>
              <PermButton
                model="settings"
                action="update"
                onClick={updateTracking}
                className="w-full"
              >
                Update
              </PermButton>
            </CardFooter>
          </Card>

          {/* WhatsApp Card */}
          <Card className="border border-gray-200 dark:border-gray-900">
            <CardHeader>
              <CardTitle>WhatsApp CTA</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input
                placeholder="WhatsApp Number"
                value={whatsapp.number || ""}
                onChange={(e) =>
                  setWhatsapp({ ...whatsapp, number: e.target.value })
                }
              />
              <Input
                placeholder="Message Text"
                value={whatsapp.message || ""}
                onChange={(e) =>
                  setWhatsapp({ ...whatsapp, message: e.target.value })
                }
              />
            </CardContent>
            <CardFooter className={"w-full mt-auto"}>
              <PermButton
                model="settings"
                action="update"
                onClick={updateWhatsapp}
                className="w-full"
              >
                Update
              </PermButton>
            </CardFooter>
          </Card>

          {/* SMTP Card */}
          <Card className="border border-gray-200 dark:border-gray-900">
            <CardHeader>
              <CardTitle>SMTP Config</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input
                placeholder="SMTP Host"
                value={smtp.host || ""}
                onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
              />
              <Input
                placeholder="SMTP Port"
                type="number"
                value={smtp.port || ""}
                onChange={(e) =>
                  setSmtp({ ...smtp, port: parseInt(e.target.value) })
                }
              />
              <Input
                placeholder="SMTP Username (your email/from email)"
                value={smtp.username || ""}
                onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
              />
              <div className="relative">
                <Input
                  placeholder="SMTP Password"
                  type={showPassword ? "text" : "password"}
                  value={smtp.password || ""}
                  onChange={(e) =>
                    setSmtp({ ...smtp, password: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                >
                  {showPassword ? (
                    <IconEyeClosed size={18} />
                  ) : (
                    <IconEye size={18} />
                  )}
                </button>
              </div>
              <Input
                placeholder="From Name"
                value={smtp.fromName || ""}
                onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
              />
              <Input
                placeholder="From Email"
                value={smtp.fromEmail || ""}
                onChange={(e) =>
                  setSmtp({ ...smtp, fromEmail: e.target.value })
                }
              />
              <Select
                value={smtp.encryption}
                onValueChange={(v) => setSmtp({ ...smtp, encryption: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Encryption" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="tls">TLS</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>

            <CardFooter className={"w-full mt-auto px-8"}>
              <div className="w-1/2 px-1.5">
                <PermButton
                  model="settings"
                  action="update"
                  className={"w-full"}
                  onClick={updateSmtp}
                >
                  Update
                </PermButton>
              </div>
              <div className="w-1/2 px-1.5">
                <Button
                  onClick={() => setTestModalOpen(true)} // Open test email dialog
                  className="w-full"
                >
                  Test SMTP
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className="border border-gray-200  w-full dark:border-gray-900">
            <CardHeader>
              <CardTitle>Email OTP Message</CardTitle>
            </CardHeader>
            <CardContent className="flex max-md:flex-col gap-6">
              {/* OTP Message */}
              <div className="w-full">
                <Input
                  placeholder="Subject"
                  value={emailMessages.otp.subject}
                  onChange={(e) =>
                    setEmailMessages({
                      ...emailMessages,
                      otp: { ...emailMessages.otp, subject: e.target.value },
                    })
                  }
                />
                <Textarea
                  placeholder="Body (use {{name}} and {{otp}})"
                  className="mt-2  h-[12rem]"
                  value={emailMessages.otp.body}
                  onChange={(e) =>
                    setEmailMessages({
                      ...emailMessages,
                      otp: { ...emailMessages.otp, body: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          <CardFooter>
            <PermButton
              model="settings"
              action="update"
              onClick={updateEmailMessages}
              className="w-full text-white dark:text-black"
            >
              Update Email Messages
            </PermButton>
          </CardFooter>
        </Card>

        <Card className="border border-gray-200 w-full dark:border-gray-900">
          <CardHeader>
            <CardTitle>Coupon Email Template</CardTitle>
          </CardHeader>
          <CardContent className="flex max-md:flex-col gap-6">
            <div className="w-full">
              <Input
                placeholder="Subject"
                value={emailMessages.coupon_generic?.subject || ""}
                onChange={(e) =>
                  setEmailMessages({
                    ...emailMessages,
                    coupon_generic: {
                      ...(emailMessages.coupon_generic || {}),
                      subject: e.target.value,
                    },
                  })
                }
              />
              <Textarea
                placeholder="Body (HTML or text). Placeholders: {{user.name}}, {{user.email}}, {{code}}, {{discount}}, {{expires}}"
                className="mt-2 h-[12rem]"
                value={emailMessages.coupon_generic?.body || ""}
                onChange={(e) =>
                  setEmailMessages({
                    ...emailMessages,
                    coupon_generic: {
                      ...(emailMessages.coupon_generic || {}),
                      body: e.target.value,
                    },
                  })
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <PermButton
              model="settings"
              action="update"
              onClick={updateEmailMessages}
              className="w-full text-white dark:text-black"
            >
              Save Coupon Template
            </PermButton>
          </CardFooter>
        </Card>

          <Card className="border h-full border-gray-200  w-full dark:border-gray-900">
            <CardHeader>
              <CardTitle>Razorpay</CardTitle>
            </CardHeader>
            <CardContent className="flex  max-md:flex-col gap-6">
              {/* OTP Message */}
              <div className="w-full">
                <Input
                  placeholder="Key ID"
                  value={razorpay.keyId}
                  className="mb-3"
                  onChange={(e) =>
                    setRazorpay({
                      ...razorpay,
                      keyId: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Key Secret"
                  value={razorpay.keySecret}
                  onChange={(e) =>
                    setRazorpay({
                      ...razorpay,
                      keySecret: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <PermButton
                model="settings"
                action="update"
                onClick={updateRazorpay}
                className="w-full text-white dark:text-black"
              >
                Update Razorpay
              </PermButton>
            </CardFooter>
          </Card>

          {/* Footer Contact Card */}
          <Card className="border border-gray-200 dark:border-gray-900">
            <CardHeader>
              <CardTitle>Footer Contact</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input
                placeholder="Contact 1"
                value={footerContact.contact1 || ""}
                onChange={(e) =>
                  setFooterContact({
                    ...footerContact,
                    contact1: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Contact 2"
                value={footerContact.contact2 || ""}
                onChange={(e) =>
                  setFooterContact({
                    ...footerContact,
                    contact2: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Email"
                value={footerContact.email || ""}
                onChange={(e) =>
                  setFooterContact({ ...footerContact, email: e.target.value })
                }
              />
              <Input
                placeholder="Location"
                value={footerContact.location || ""}
                onChange={(e) =>
                  setFooterContact({
                    ...footerContact,
                    location: e.target.value,
                  })
                }
              />
              <Textarea
                placeholder="Brief about the Website"
                value={footerContact.brief || ""}
                onChange={(e) =>
                  setFooterContact({ ...footerContact, brief: e.target.value })
                }
              />
            </CardContent>
            <CardFooter className={"w-full mt-auto"}>
              <PermButton
                model="settings"
                action="update"
                onClick={updateFooterContact}
                className="w-full"
              >
                Update Footer Contact
              </PermButton>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Test Email Modal */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="border-gray-300 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Test SMTP Settings</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Receiver Email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full mt-4"
          />
          <DialogFooter>
            {!isSend ? (
              <Button onClick={sendTestEmail} className="w-full mt-4">
                Send Test Email
              </Button>
            ) : (
              <Button onClick={sendTestEmail} className="w-full mt-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExportDialog openDialog={openExport} setOpenDialog={setOpenExport} />
    </div>
  );
}
