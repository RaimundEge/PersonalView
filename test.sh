#! /bin/bash

for FILE in `cat all`; do
   if [ -f $FILE ]; then
      if [ "${FILE##*.}" != "db" ]; then
         echo ">${FILE##*.}<"
      fi
   fi
done
