import {
  APP_NAME,
  UNIVERSITY_NAME,
  UNIVERSITY_EMAIL,
  UNIVERSITY_ADDRESS,
} from '@components/common/constants';
import { Mail, MapPin, Facebook, Github, Linkedin } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-secondary text-secondary-foreground'>
      <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-6'>
          {/* About Section */}
          <div className='col-span-1 md:col-span-2'>
            <div className='mb-4 flex items-center space-x-2'>
              <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-lg'>
                <span className='text-primary-foreground text-lg font-bold'>E</span>
              </div>
              <span className='text-foreground text-xl font-bold'>{APP_NAME}</span>
            </div>
            <p className='text-muted-foreground mb-4 max-w-md'>
              A comprehensive mobile web-based approach to school event attendance monitoring with
              integrated analytics for {UNIVERSITY_NAME}.
            </p>
          </div>

          {/* Quick Links */}
          <div className='space-y-4'>
            <h3 className='border-success text-foreground border-b pb-2 text-lg font-semibold'>
              Quick Links
            </h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  to='/'
                  className='text-muted-foreground hover:text-foreground transition-colors duration-200'
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to='/events'
                  className='text-muted-foreground hover:text-foreground transition-colors duration-200'
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to='/roadmap'
                  className='text-muted-foreground hover:text-foreground transition-colors duration-200'
                >
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className='col-span-1 space-y-4 md:col-span-2'>
            <h3 className='border-success text-foreground border-b pb-2 text-lg font-semibold'>
              Contact Info
            </h3>
            <ul className='space-y-3'>
              <li className='text-muted-foreground flex items-start space-x-3'>
                <MapPin size={20} className='text-success mt-1' />
                <span>{UNIVERSITY_ADDRESS}</span>
              </li>
              <li className='text-muted-foreground flex items-center space-x-3'>
                <Mail size={20} className='text-success' />
                <span>{UNIVERSITY_EMAIL}</span>
              </li>
            </ul>
          </div>

          {/* Social Media Links */}
          <div className='space-y-4'>
            <h3 className='border-success text-foreground border-b pb-2 text-lg font-semibold'>
              Connect With Us
            </h3>
            <div className='flex space-x-4'>
              <a
                href='https://web.facebook.com/snsuuscmaincampus'
                className='text-muted-foreground hover:text-success transition-colors duration-200'
                aria-label='Facebook'
              >
                <Facebook size={24} />
              </a>
              <a
                href='https://github.com/lowmax205'
                className='text-muted-foreground hover:text-success transition-colors duration-200'
                aria-label='Github'
              >
                <Github size={24} />
              </a>
              <a
                href='https://www.linkedin.com/in/nilojrolang'
                className='text-muted-foreground hover:text-success transition-colors duration-200'
                aria-label='Instagram'
              >
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className='border-border text-muted-foreground mt-12 border-t pt-8 text-center'>
          <p>
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <p className='text-foreground mt-2 text-sm'>Developed for {UNIVERSITY_NAME}</p>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
export default Footer;
