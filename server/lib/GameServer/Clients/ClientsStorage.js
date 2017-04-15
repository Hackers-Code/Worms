'use strict';
const Client = require( './Client' );
const UniqueKeyGenerator = require( '../../Helpers/UniqueKeyGenerator' );
const DecodePacket = require( '../Protocol/PacketDecoder' );
const Sockets = require( '../Protocol/Types' ).Sockets;
class ClientsStorage {
	constructor()
	{
		this.clients = [];
		this.uniqueKeyGenerator = new UniqueKeyGenerator( 4 );
	}

	findByRinfo( rinfo )
	{
		for( let i = 0 ; i < this.clients.length ; i++ )
		{
			let clientRinfo = this.clients[ i ].getRinfo();
			if( clientRinfo === null )
			{
				continue;
			}
			if( rinfo.port === clientRinfo.port && rinfo.address === clientRinfo.address )
			{
				return i;
			}
		}
		return -1;
	}

	getClientsCount()
	{
		return this.clients.length;
	}

	addClient( socketWrite, server )
	{
		let index = this.clients.push( new Client( socketWrite, server, this ) ) - 1;
		let id = this.uniqueKeyGenerator.generateKey();
		this.clients[ index ].setId( id );
		return this.clients[ index ];
	}

	removeClient( id )
	{
		let client = SearchEngine.findByUniqueID( id, this.clients );
		if( client !== -1 )
		{
			this.uniqueKeyGenerator.freeKey( this.clients[ client ].id );
			this.clients.splice( client, 1 );
			return true;
		}
		return false;
	}

	passUDPPacket( packet, rinfo, socketSend )
	{
		let result = this.findByRinfo( rinfo );
		if( result === -1 )
		{
			let decodedPacket = DecodePacket( packet, Sockets.udp );
			if( decodedPacket === false || typeof decodedPacket.object.id === 'undefined' )
			{
				return false;
			}
			let index = SearchEngine.findByUniqueID( decodedPacket.object.id, this.clients );
			if( index === -1 )
			{
				return false;
			}
			this.clients[ index ].assignUDPSocket( rinfo, socketSend );
		}
		else
		{
			this.clients[ result ].handleData( packet, Sockets.udp );
		}
		return true;
	}
}

module.exports = ClientsStorage;
