import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Globe, Compass, BookOpen, Map as MapIcon, Hexagon, Anchor, Navigation } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Category = 'Weird & Unusual' | 'Hidden Gems' | 'Mysterious';

interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  category: Category;
  description: string;
}

const PLACES: Place[] = [
  {
    id: '1',
    name: 'Cypress Swamp Driftwood Family Museum',
    city: 'Pierre Part, Louisiana',
    country: 'USA',
    category: 'Weird & Unusual',
    description: 'This Louisiana folk art gallery is a gnarled collection of driftwood homonculi.'
  },
  {
    id: '2',
    name: 'Waldemar Julsrud Museum',
    city: 'Acámbaro',
    country: 'Mexico',
    category: 'Mysterious',
    description: 'This small museum holds a treasure trove of ceramic figures that some claim are evidence of ancient humans coexisting with dinosaurs.'
  },
  {
    id: '3',
    name: 'Antonio Pigafetta Memorial and Birthplace',
    city: 'Vicenza',
    country: 'Italy',
    category: 'Hidden Gems',
    description: 'A memorial to the Vicentine who survived and documented Magellan\'s circumnavigation of the world.'
  },
  {
    id: '4',
    name: 'Clinton Home',
    city: 'Nago-shi',
    country: 'Japan',
    category: 'Weird & Unusual',
    description: 'An exact replica of Bill Clinton\'s childhood home built in Japan.'
  },
  {
    id: '5',
    name: 'Deutsche Strasse Memorial Stone',
    city: 'Hahndorf',
    country: 'Australia',
    category: 'Hidden Gems',
    description: 'A stone monument dedicated to the German pioneers who settled the town.'
  },
  {
    id: '6',
    name: 'Makoko Floating School',
    city: 'Lagos',
    country: 'Nigeria',
    category: 'Hidden Gems',
    description: 'An innovative floating structure built for the historic water community of Makoko.'
  },
  {
    id: '7',
    name: 'Karni Mata Temple',
    city: 'Deshnoke',
    country: 'India',
    category: 'Mysterious',
    description: 'Famous for its approximately 25,000 black rats that are revered and protected.'
  },
  {
    id: '8',
    name: 'Salina Turda',
    city: 'Turda',
    country: 'Romania',
    category: 'Hidden Gems',
    description: 'A massive underground salt mine turned into a subterranean amusement park.'
  },
  {
    id: '9',
    name: 'Catacombs of Paris',
    city: 'Paris',
    country: 'France',
    category: 'Mysterious',
    description: 'Underground ossuaries which hold the remains of more than six million people.'
  },
  {
    id: '10',
    name: 'Guanajuato Mummies',
    city: 'Guanajuato',
    country: 'Mexico',
    category: 'Weird & Unusual',
    description: 'A museum containing a number of naturally mummified bodies interred during a cholera outbreak.'
  },
  {
    id: '11',
    name: 'Derweze Temple',
    city: 'Bikaner',
    country: 'India',
    category: 'Weird & Unusual',
    description: 'Another bizarre site with peculiar historical origins.'
  },
  {
    id: '12',
    name: 'Overtoun Bridge',
    city: 'Dumbarton',
    country: 'Scotland',
    category: 'Mysterious',
    description: 'A bridge famous for a high number of unexplained dog leaps.'
  }
];

const TOP_COUNTRIES = [
  { name: 'Italy', count: 12 },
  { name: 'Mexico', count: 9 },
  { name: 'Australia', count: 6 },
  { name: 'India', count: 5 },
  { name: 'Germany', count: 5 },
  { name: 'Sweden', count: 5 },
  { name: 'Japan', count: 4 },
  { name: 'USA', count: 4 },
  { name: 'France', count: 4 },
  { name: 'Brazil', count: 3 }
];

const TOP_CITIES = [
  { name: 'Panaji', count: 3 },
  { name: 'Freetown', count: 2 },
  { name: 'Pune', count: 2 },
  { name: 'Göttingen', count: 2 },
  { name: 'Larne', count: 2 }
];

const WORD_CLOUD = [
  { word: 'Museum', size: 42 },
  { word: 'Temple', size: 36 },
  { word: 'Memorial', size: 32 },
  { word: 'Stone', size: 28 },
  { word: 'House', size: 24 },
  { word: 'Ghost', size: 22 },
  { word: 'Secret', size: 20 },
  { word: 'Underground', size: 18 },
  { word: 'Ruins', size: 16 },
  { word: 'Park', size: 14 }
];

export function Dashboard() {
  const [search, setSearch] = useState('');

  const filteredPlaces = useMemo(() => {
    return PLACES.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const getCategoryColor = (cat: Category) => {
    switch(cat) {
      case 'Weird & Unusual': return 'bg-[#ffc107] text-black border-[#ffc107]';
      case 'Hidden Gems': return 'bg-[#00cc66] text-black border-[#00cc66]';
      case 'Mysterious': return 'bg-[#b366ff] text-black border-[#b366ff]';
    }
  };

  const getCategoryTextColor = (cat: Category) => {
    switch(cat) {
      case 'Weird & Unusual': return 'text-[#ffc107]';
      case 'Hidden Gems': return 'text-[#00cc66]';
      case 'Mysterious': return 'text-[#b366ff]';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary selection:text-primary-foreground">
      {/* Hero Header */}
      <div className="relative h-[400px] w-full overflow-hidden flex flex-col justify-end p-8 md:p-16 border-b border-border">
        <div className="absolute inset-0 z-0">
          <img 
            src="/__mockup/images/hero-map.png" 
            alt="Ancient world map" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Compass className="w-5 h-5 animate-pulse duration-3000" />
            <span className="uppercase tracking-[0.2em] text-xs font-semibold">Atlas Obscura Project</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 font-serif text-white tracking-tight">
            The Explorer's Ledger
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-light mb-8">
            A digital cartography of 100 unusual, hidden, and mysterious places scraped from the edges of the known world.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-1 rounded-full border border-[#ffc107]/30 bg-[#ffc107]/10 text-[#ffc107] text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffc107]"></span>
              Weird & Unusual: 31
            </div>
            <div className="px-4 py-1 rounded-full border border-[#00cc66]/30 bg-[#00cc66]/10 text-[#00cc66] text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00cc66]"></span>
              Hidden Gems: 50
            </div>
            <div className="px-4 py-1 rounded-full border border-[#b366ff]/30 bg-[#b366ff]/10 text-[#b366ff] text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#b366ff]"></span>
              Mysterious: 19
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <MapIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Places</p>
                <p className="text-3xl font-serif font-bold text-white">100</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Countries</p>
                <p className="text-3xl font-serif font-bold text-white">42</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Cities</p>
                <p className="text-3xl font-serif font-bold text-white">87</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-[#00cc66]/10 rounded-lg text-[#00cc66]">
                <Hexagon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Dominant</p>
                <p className="text-lg font-serif font-bold text-[#00cc66] leading-tight mt-1">Hidden Gems</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Top Countries */}
          <Card className="col-span-1 lg:col-span-2 bg-card/40 border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-serif flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> Global Distribution
              </CardTitle>
              <CardDescription>Top 10 countries with the most discoveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TOP_COUNTRIES.map((country, i) => (
                  <div key={country.name} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-muted-foreground">{country.name}</div>
                    <div className="flex-1">
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                          style={{ width: `${(country.count / 12) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-8 text-right text-sm font-serif font-bold">{country.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories Breakdown */}
          <Card className="col-span-1 bg-card/40 border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-serif flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Curiosities
              </CardTitle>
              <CardDescription>Classification of findings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#00cc66] font-medium">Hidden Gems</span>
                    <span className="text-white font-serif">50%</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-[#00cc66] w-[50%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#ffc107] font-medium">Weird & Unusual</span>
                    <span className="text-white font-serif">31%</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-[#ffc107] w-[31%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#b366ff] font-medium">Mysterious</span>
                    <span className="text-white font-serif">19%</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-[#b366ff] w-[19%]" />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Top Cities</h4>
                <div className="space-y-3">
                  {TOP_CITIES.map(city => (
                    <div key={city.name} className="flex justify-between items-center text-sm">
                      <span>{city.name}</span>
                      <Badge variant="outline" className="bg-background/50">{city.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Word Cloud / Frequency */}
        <Card className="mb-12 bg-card/40 border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Anchor className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Nomenclature of the Unknown</CardTitle>
            <CardDescription>Most frequent words in place names</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center justify-center p-8 bg-background/30 rounded-xl border border-border/50">
              {WORD_CLOUD.map((item, i) => (
                <span 
                  key={item.word} 
                  className="font-serif transition-colors hover:text-primary cursor-default"
                  style={{ 
                    fontSize: `${Math.max(14, item.size)}px`,
                    opacity: Math.max(0.4, item.size / 42),
                    color: i % 3 === 0 ? 'hsl(var(--primary))' : i % 3 === 1 ? '#00cc66' : '#b366ff'
                  }}
                >
                  {item.word}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Places Grid */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-3xl font-serif font-bold flex items-center gap-3">
            <Navigation className="w-6 h-6 text-primary" /> The Manifest
          </h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search the ledger..." 
              className="pl-10 bg-card/50 border-border/50 focus-visible:ring-primary"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map(place => (
            <Card key={place.id} className="bg-card/40 border-border/50 hover:bg-card/80 transition-all duration-300 group overflow-hidden flex flex-col">
              <div className={`h-1 w-full ${getCategoryColor(place.category)}`} />
              <CardHeader className="pb-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`font-medium ${getCategoryColor(place.category)} border-0 shadow-none`}>
                    {place.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors leading-tight">
                  {place.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {place.city}, {place.country}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed pt-0">
                {place.description}
              </CardContent>
            </Card>
          ))}
          {filteredPlaces.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 opacity-50" />
              <p className="font-serif text-xl">No discoveries match your query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
