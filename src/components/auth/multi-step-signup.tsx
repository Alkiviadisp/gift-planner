"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

interface StepProps {
  onNext: () => void
  onBack?: () => void
  isLoading: boolean
}

interface Country {
  code: string;
  name: string;
  flag_emoji: string;
  is_active: boolean;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

// Step 1: Basic Info
function BasicInfoStep({ onNext, isLoading, formData, setFormData }: StepProps & {
  formData: any;
  setFormData: (data: any) => void;
}) {
  const [errors, setErrors] = useState({ email: "", password: "", nickname: "" })

  const validateForm = (formData: FormData) => {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const nickname = formData.get("nickname") as string
    const newErrors = { email: "", password: "", nickname: "" }

    // Email validation
    if (!email) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    // Password validation
    if (!password) newErrors.password = "Password is required"
    else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    // Nickname validation
    if (!nickname) newErrors.nickname = "Nickname is required"

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formDataObj = new FormData(e.currentTarget)
    if (validateForm(formDataObj)) {
      setFormData({
        ...formData,
        email: formDataObj.get("email"),
        password: formDataObj.get("password"),
        nickname: formDataObj.get("nickname"),
      })
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="m@example.com"
          disabled={isLoading}
          defaultValue={formData.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          disabled={isLoading}
          defaultValue={formData.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          name="nickname"
          type="text"
          disabled={isLoading}
          defaultValue={formData.nickname}
        />
        {errors.nickname && (
          <p className="text-sm text-destructive">{errors.nickname}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        Next
      </Button>
    </form>
  )
}

// Step 2: Location Info
function LocationStep({ onNext, onBack, isLoading, formData, setFormData }: StepProps & {
  formData: any;
  setFormData: (data: any) => void;
}) {
  const [country, setCountry] = useState(formData.country || "")
  const [currency, setCurrency] = useState(formData.currency || "")
  const [error, setError] = useState("")
  const [countries, setCountries] = useState<Country[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])

  useEffect(() => {
    const fetchData = async () => {
      // Fetch countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (countriesError) {
        console.error('Error fetching countries:', countriesError)
      } else {
        setCountries(countriesData)
      }

      // Fetch currencies
      const { data: currenciesData, error: currenciesError } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('code')

      if (currenciesError) {
        console.error('Error fetching currencies:', currenciesError)
      } else {
        setCurrencies(currenciesData)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!country || !currency) {
      setError("Please select both country and currency")
      return
    }
    setFormData({
      ...formData,
      country,
      currency
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map(country => (
              <SelectItem key={country.code} value={country.code}>
                <span className="inline-flex items-center gap-2">
                  <span>{country.flag_emoji}</span>
                  <span>{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue placeholder="Select your currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map(currency => (
              <SelectItem key={currency.code} value={currency.code}>
                <span className="inline-flex items-center gap-2">
                  <span>{currency.symbol}</span>
                  <span>{currency.name} ({currency.code})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          Next
        </Button>
      </div>
    </form>
  )
}

// Step 3: Categories
function CategoriesStep({ onNext, onBack, isLoading, formData, setFormData }: StepProps & {
  formData: any;
  setFormData: (data: any) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(formData.selectedCategories || [])
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('predefined_categories')
        .select('*')
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      setCategories(data)
    }

    fetchCategories()
  }, [])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      }
      if (prev.length >= 5) {
        setError("You can only select up to 5 categories")
        return prev
      }
      setError("")
      return [...prev, categoryId]
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedCategories.length !== 5) {
      setError("Please select exactly 5 categories")
      return
    }
    setFormData({
      ...formData,
      selectedCategories
    })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Select 5 categories that interest you ({selectedCategories.length}/5)
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => toggleCategory(category.id)}
            className={cn(
              "relative p-4 rounded-lg border-2 text-left transition-all",
              "hover:border-primary/50",
              selectedCategories.includes(category.id)
                ? "border-primary bg-primary/5"
                : "border-muted"
            )}
            style={{
              backgroundColor: selectedCategories.includes(category.id)
                ? `${category.color}15`
                : undefined,
              borderColor: selectedCategories.includes(category.id)
                ? category.color
                : undefined
            }}
          >
            {selectedCategories.includes(category.id) && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-primary" style={{ color: category.color }} />
              </div>
            )}
            <div className="text-2xl mb-2">{category.icon}</div>
            <div className="font-medium">{category.name}</div>
            <div className="text-xs text-muted-foreground">{category.description}</div>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          Complete Registration
        </Button>
      </div>
    </form>
  )
}

export function MultiStepSignup() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    country: "",
    currency: "",
    selectedCategories: [] as string[]
  })

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // 1. Sign up with minimal data
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('No user data returned')
      }

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          nickname: formData.nickname,
          country: formData.country,
          currency: formData.currency
        })

      if (profileError) {
        console.error('Profile error:', profileError)
        throw profileError
      }

      // 3. Add user interests if categories were selected
      if (formData.selectedCategories && formData.selectedCategories.length > 0) {
        const { error: interestsError } = await supabase
          .from('user_interests')
          .insert(
            formData.selectedCategories.map(categoryId => ({
              user_id: authData.user!.id,
              category_id: categoryId
            }))
          )

        if (interestsError) {
          console.error('Interests error:', interestsError)
          // Don't throw here, as the main signup was successful
        }
      }

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  interface Step {
    title: string;
    component: (props: StepProps) => JSX.Element;
  }

  const steps = [
    {
      title: "Basic Information",
      component: (props: StepProps) => (
        <BasicInfoStep {...props} formData={formData} setFormData={setFormData} />
      )
    },
    {
      title: "Location",
      component: (props: StepProps) => (
        <LocationStep {...props} formData={formData} setFormData={setFormData} />
      )
    },
    {
      title: "Interests",
      component: (props: StepProps) => (
        <CategoriesStep {...props} formData={formData} setFormData={setFormData} />
      )
    }
  ] satisfies Step[]

  // Ensure step is within bounds and has a valid value
  const currentStep = Math.max(0, Math.min(step - 1, 2)) // We know we have exactly 3 steps
  
  // Runtime safety check
  if (!steps[currentStep]) {
    console.error('Invalid step index:', currentStep);
    toast({
      title: "Error",
      description: "An error occurred with the registration form. Please try again.",
      variant: "destructive",
    });
    return null;
  }

  const CurrentStep = steps[currentStep].component
  const currentTitle = steps[currentStep].title

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {currentTitle}
        </h2>
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 rounded-full flex-1 transition-colors",
                index + 1 === step
                  ? "bg-primary"
                  : index + 1 < step
                  ? "bg-primary/50"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <CurrentStep
        onNext={step === steps.length ? handleComplete : () => setStep(s => s + 1)}
        onBack={step > 1 ? () => setStep(s => s - 1) : undefined}
        isLoading={isLoading}
      />
    </div>
  )
} 