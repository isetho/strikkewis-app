import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Wand2, Sparkles, PenLine, ArrowRight, Heart } from 'lucide-react';
import { knittingImages } from '../../constants';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="relative bg-[#fff7ff] overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="font-text-10xl text-black mb-6 flex items-center justify-center gap-2">
              En lettere måte å lage og lese strikkeoppskrifter på <Heart className="text-purple500-regular" />
            </h1>
            <p className="font-text-base text-black max-w-2xl mx-auto mb-8">
              Strikkewis har gjort det enklere å både lage og følge strikkeoppskrifter. Bli med på reisen mot en enklere strikkehverdag!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/login')}
                className="min-w-[200px]"
              >
                For strikkedesignere
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="min-w-[200px]"
              >
                For strikkere
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-text-2xl text-black mb-4">
              Slik gjør vi strikking enklere
            </h2>
            <p className="font-text-base text-black max-w-2xl mx-auto">
              Vi kombinerer tradisjonelt håndverk med moderne teknologi for å skape en bedre strikkeopplevelse.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#fff7ff] p-8 rounded-xl">
              <div className="w-12 h-12 bg-purple200-light rounded-full flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6 text-purple500-regular" />
              </div>
              <h3 className="font-text-xl mb-4">Skreddersydd for deg</h3>
              <p className="text-black">
                Følg din egen progresjon med en interaktiv steg-for-steg guide tilpasset ditt prosjekt.
              </p>
            </div>
            <div className="bg-[#fff7ff] p-8 rounded-xl">
              <div className="w-12 h-12 bg-purple200-light rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple500-regular" />
              </div>
              <h3 className="font-text-xl mb-4">Lærerik prosess</h3>
              <p className="text-black">
                Lær nye teknikker med innebygde videoer og hold oversikt over fremgangen din.
              </p>
            </div>
            <div className="bg-[#fff7ff] p-8 rounded-xl">
              <div className="w-12 h-12 bg-purple200-light rounded-full flex items-center justify-center mb-4">
                <PenLine className="w-6 h-6 text-purple500-regular" />
              </div>
              <h3 className="font-text-xl mb-4">Moderne strikking</h3>
              <p className="text-black">
                En digital plattform som forener tradisjonelt håndverk med moderne teknologi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Grid Section */}
      <div className="bg-[#fff7ff] py-16 sm:py-24">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h2 className="font-text-2xl text-black mb-6">
                Strikking på dine premisser
              </h2>
              <p className="text-black mb-6">
                Med vår digitale plattform kan du:
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple200-light rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-purple500-regular" />
                  </div>
                  <span className="text-black">Følge oppskrifter steg for steg</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple200-light rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-purple500-regular" />
                  </div>
                  <span className="text-black">Holde oversikt over dine prosjekter</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple200-light rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-purple500-regular" />
                  </div>
                  <span className="text-black">Lære nye teknikker med videoguider</span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <img
                src={knittingImages.yarn}
                alt="Knitting illustration"
                className="w-auto h-auto mx-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-text-2xl text-black mb-6">
            Bli med på strikkereisen 💜
          </h2>
          <p className="text-black max-w-2xl mx-auto mb-8">
            Enten du er en erfaren strikkedesigner eller nybegynner, har vi verktøyene du trenger for å lykkes med dine strikkeprosjekter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/login')}
              className="min-w-[200px]"
            >
              For strikkedesignere
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="min-w-[200px]"
            >
              For strikkere
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};