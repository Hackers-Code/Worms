'use strict';
const Collection = require( '../../Collections' ).NumericIdCollection;
class Room extends Collection {
	constructor( settings, admin, id, roomsCollection )
	{
		super( 'players', 'lobbyID' );
		this.nextClientId = 0;
		this.name = settings.name;
		this.password = settings.password;
		this.admin = admin;
		this.admin.assignRoom( this, this.nextClientId++, true );
		this.players = [];
		this.players.push( admin );
		this.id = id;
		this.roomsCollection = roomsCollection;
		this.mapAPI = roomsCollection.getMapAPI();
		this.physics = {
			gravity : 475,
			jumpHeight : -300,
			maxSpeedY : 1024,
			maxSpeedX : 160
		};
		this.playersCount = 0;
		this.mapID = 0;
		this.isConfigured = false;
		this.isWaitingForPlayers = false;
		this.isWaitingForConfirming = false;
		this.isInGame = false;
		this.leaderboard = [];
	}

	isAvailable()
	{
		return this.isWaitingForPlayers;
	}

	getPlayersList()
	{
		let retval = [];
		for( let i = 0 ; i < this.players.length ; i++ )
		{
			retval.push( this.players[ i ].getPublicData() );
		}
		return retval;
	}

	getReadyPlayersCount()
	{
		let retval = 0;
		for( let i = 0 ; i < this.players.length ; i++ )
		{
			retval += this.players[ i ].isReady();
		}
		return retval;
	}

	setPhysics( data )
	{
		if( this.isConfigured === false )
		{
			this.physics = data;
			return true;
		}
		return false;
	}

	setConfig( data )
	{
		if( this.isConfigured === false )
		{
			if( data.players < 2 || data.players > 4 )
			{
				return false;
			}
			if( !this.mapAPI.mapExists( data.map ) )
			{
				return false;
			}
			this.mapID = data.map;
			this.playersCount = data.players;
			return true;
		}
		return false;
	}

	leave( id )
	{
		if( this.isInGame )
		{
			if( Buffer.compare( this.admin.id, id ) )
			{
				this.roomsCollection.removeRoom( this.id );
				this.players.splice( 0, 1 );
				this.players.forEach( ( element ) =>
				{
					element.kickFromLobby( 'Admin left lobby!' );
				} );
			}
			else
			{
				let index = this.find( id );
				if( index !== -1 )
				{
					this.players.splice( index, 1 );
					if( this.isWaitingForConfirming )
					{
						this.isWaitingForPlayers = true;
						this.isWaitingForConfirming = false;
					}
				}
			}
		}
		else
		{
			let index = this.find( id );
			if( index !== -1 )
			{
				this.leaderboard.unshift( { id : this.players[ index ].id } );
				this.players.splice( index, 1 );
				if( this.players.length === 1 )
				{
					this.leaderboard.unshift( { id : this.players[ 0 ].id } );
					this.players[ 0 ].finishGame( this.leaderboard );
				}
				if( this.players.length === 0 )
				{
					this.roomsCollection.removeRoom( this.id );
				}
			}
		}
	}
}

module.exports = Room;
